import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Column mapping per app — normalize diverse schemas into a common shape
interface NormalizedUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  app: string;
  created_at: string;
  last_sign_in_at: string | null;
  dealership_name?: string | null;
  account_type?: string | null;
}

// Map from app-specific schemas to normalized user
function normalizeUsers(rows: any[], appName: string, usersTable: string): NormalizedUser[] {
  return rows.map((r) => {
    // Different apps use different column names
    const name =
      r.display_name ||
      r.name ||
      [r.first_name, r.last_name].filter(Boolean).join(" ") ||
      r.email ||
      "Unknown";

    const email = r.email || "";
    const phone = r.phone || r.mobile || r.mfa_phone || null;

    // Role normalization
    const rawRole = r.role || "user";
    const roleMap: Record<string, string> = {
      super_admin: "admin",
      admin: "admin",
      manager: "manager",
      consultant: "user",
      member: "user",
      user: "user",
      viewer: "viewer",
      dealer: "user",
      wholesaler: "user",
    };
    const role = roleMap[rawRole] || rawRole;

    // Status normalization
    let status = "active";
    if (r.status) {
      status = r.status;
    } else if (r.is_active === false || r.active === false) {
      status = "inactive";
    } else if (r.banned_until) {
      status = "suspended";
    } else if (r.deleted_at) {
      status = "inactive";
    }

    return {
      id: r.id,
      name,
      email,
      phone,
      role,
      status,
      app: appName,
      created_at: r.created_at,
      last_sign_in_at: r.last_sign_in_at || r.last_login_at || r.updated_at || null,
      dealership_name: r.dealership_name || null,
      account_type: r.account_type || null,
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const wtUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authedClient = createClient(wtUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const serviceClient = createClient(wtUrl, serviceKey);

    const { data: authData, error: authError } = await authedClient.auth.getUser();
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: caller, error: callerError } = await serviceClient
      .from("wt_users")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (callerError || caller?.role !== "super_admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Read app registry from Watchtower DB
    const wt = serviceClient;

    const { data: appConfigs, error: configErr } = await wt
      .from("wt_app_registry")
      .select("id, name, supabase_url, supabase_ref, users_table")
      .not("supabase_url", "is", null);

    if (configErr) throw configErr;

    // 2. Fetch anon keys from secrets (stored as ANON_KEY_{REF})
    //    OR use service role for local Watchtower, anon for external
    const allUsers: NormalizedUser[] = [];

    // Fetch from each project in parallel
    const fetches = (appConfigs || []).map(async (app: any) => {
      try {
        const isLocal = app.supabase_ref === "txlbhwvlzbceegzkoimr";
        const usersTable = app.users_table || "users";

        if (isLocal) {
          // Query local Watchtower DB directly
          const { data, error } = await wt
            .from(usersTable)
            .select("*, dealership_name, account_type")
            .limit(200);
          if (error) {
            console.error(`Error fetching ${app.name}:`, error.message);
            return;
          }
          allUsers.push(...normalizeUsers(data || [], app.name, usersTable));
        } else {
          // Query external project via REST API with service role key (bypasses RLS)
          const svcKey = Deno.env.get(`SERVICE_KEY_${app.supabase_ref}`);
          if (!svcKey) {
            console.warn(`No service key for ${app.name} (${app.supabase_ref})`);
            return;
          }

          // Select all and let normalizer pick what it needs
          const res = await fetch(
            `${app.supabase_url}/rest/v1/${usersTable}?select=*&limit=200`,
            {
              headers: {
                apikey: svcKey,
                Authorization: `Bearer ${svcKey}`,
              },
            }
          );

          if (!res.ok) {
            console.error(`${app.name} API error: ${res.status} ${await res.text()}`);
            return;
          }

          const data = await res.json();
          allUsers.push(...normalizeUsers(data, app.name, usersTable));
        }
      } catch (err) {
        console.error(`Failed to fetch ${app.name}:`, err);
      }
    });

    await Promise.all(fetches);

    // 3. Sort by created_at desc
    allUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Debug: include config count in response headers
    const debugInfo = `configs=${(appConfigs||[]).length},users=${allUsers.length}`;

    return new Response(JSON.stringify(allUsers), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("all-users error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
