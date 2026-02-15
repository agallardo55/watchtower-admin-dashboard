import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, app, fields } = await req.json();

    if (!userId || !app || !fields) {
      return new Response(
        JSON.stringify({ error: "Missing userId, app, or fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Look up project config from app registry
    const wtUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const wt = createClient(wtUrl, serviceKey);

    const { data: appConfig, error: configErr } = await wt
      .from("wt_app_registry")
      .select("supabase_ref, supabase_url, users_table")
      .eq("name", app)
      .single();

    if (configErr || !appConfig) {
      return new Response(
        JSON.stringify({ error: `App "${app}" not found in registry` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isLocal = appConfig.supabase_ref === "txlbhwvlzbceegzkoimr";
    const usersTable = appConfig.users_table || "users";

    // 2. Map normalized field names to app-specific column names
    // The modal sends: firstName, lastName, email, phone, role, status, appAssignment
    const columnMap: Record<string, Record<string, string>> = {
      // Watchtower uses wt_users directly (not the view)
      Watchtower: { firstName: "first_name", lastName: "last_name", email: "email", phone: "phone", role: "role", status: "status" },
      // BuybidHQ public.users
      BuybidHQ: { firstName: "name", email: "email", phone: "mobile", role: "role", status: "status" },
      // SalesboardHQ public.users
      SalesboardHQ: { firstName: "name", email: "email", phone: "mobile", role: "role" },
      // Demolight public.users
      Demolight: { firstName: "first_name", lastName: "last_name", email: "email", phone: "phone", role: "role" },
      // SalesLogHQ uses sl_users on Watchtower
      SalesLogHQ: { firstName: "display_name", email: "email", phone: "phone", role: "role" },
    };

    const mapping = columnMap[app] || columnMap.Watchtower;
    const updatePayload: Record<string, any> = {};

    // Build name field for apps that use a single "name" column
    if (mapping.firstName === "name" && (fields.firstName || fields.lastName)) {
      updatePayload.name = [fields.firstName, fields.lastName].filter(Boolean).join(" ");
    } else if (mapping.firstName === "display_name" && (fields.firstName || fields.lastName)) {
      updatePayload.display_name = [fields.firstName, fields.lastName].filter(Boolean).join(" ");
    } else {
      if (fields.firstName && mapping.firstName) updatePayload[mapping.firstName] = fields.firstName;
      if (fields.lastName && mapping.lastName) updatePayload[mapping.lastName] = fields.lastName;
    }

    if (fields.email && mapping.email) updatePayload[mapping.email] = fields.email;
    if (fields.phone && mapping.phone) updatePayload[mapping.phone] = fields.phone;
    if (fields.role && mapping.role) updatePayload[mapping.role] = fields.role;

    // Status handling — some apps use is_active boolean, others use status text
    if (fields.status) {
      if (mapping.status) {
        updatePayload[mapping.status] = fields.status;
      } else {
        // Convert to is_active boolean
        updatePayload.is_active = fields.status === "active";
        if (fields.status === "active") updatePayload.active = true;
      }
    }

    updatePayload.updated_at = new Date().toISOString();

    if (Object.keys(updatePayload).length <= 1) {
      return new Response(
        JSON.stringify({ error: "No valid fields to update" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Perform the update
    let targetTable = usersTable;

    // For Watchtower apps that use the view, route to the actual table
    if (app === "Watchtower") targetTable = "wt_users";
    if (app === "SalesLogHQ") targetTable = "sl_users";
    if (app === "Agentflow") targetTable = "af_users";
    if (app === "CUDL Rate Capture") targetTable = "cr_users";
    if (app === "Demolight" && isLocal) targetTable = "dl_users";

    if (isLocal) {
      // Update on Watchtower DB directly
      const { error: updateErr } = await wt
        .from(targetTable)
        .update(updatePayload)
        .eq("id", userId);

      if (updateErr) throw updateErr;
    } else {
      // Update on external project via REST API
      const svcKey = Deno.env.get(`SERVICE_KEY_${appConfig.supabase_ref}`);
      if (!svcKey) {
        return new Response(
          JSON.stringify({ error: `No service key for ${app}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const res = await fetch(
        `${appConfig.supabase_url}/rest/v1/${targetTable}?id=eq.${userId}`,
        {
          method: "PATCH",
          headers: {
            apikey: svcKey,
            Authorization: `Bearer ${svcKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(updatePayload),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Update failed on ${app}: ${res.status} ${errText}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, updated: updatePayload }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("update-user error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
