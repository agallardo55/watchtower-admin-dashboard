import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEMOLIGHT_URL = "https://owjvzqtfiyfnrdtsumqa.supabase.co";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, userId, fields } = await req.json();

    if (!action || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing action or userId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const serviceKey = Deno.env.get("SERVICE_KEY_owjvzqtfiyfnrdtsumqa");
    if (!serviceKey) {
      return new Response(
        JSON.stringify({ error: "Missing Demolight service key" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(DEMOLIGHT_URL, serviceKey);

    // --- UPDATE ---
    if (action === "update") {
      if (!fields || Object.keys(fields).length === 0) {
        return new Response(
          JSON.stringify({ error: "No fields to update" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const updatePayload: Record<string, unknown> = {};
      if (fields.firstName !== undefined)
        updatePayload.first_name = fields.firstName;
      if (fields.lastName !== undefined)
        updatePayload.last_name = fields.lastName;
      if (fields.email !== undefined) updatePayload.email = fields.email;
      if (fields.phone !== undefined) updatePayload.phone = fields.phone;
      if (fields.role !== undefined) updatePayload.role = fields.role;
      if (fields.is_active !== undefined)
        updatePayload.is_active = fields.is_active;
      updatePayload.updated_at = new Date().toISOString();

      // Update public.users via REST API
      const res = await fetch(
        `${DEMOLIGHT_URL}/rest/v1/users?id=eq.${userId}`,
        {
          method: "PATCH",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(updatePayload),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Update public.users failed: ${res.status} ${errText}`);
      }

      // If email changed, also update auth user
      if (fields.email) {
        const { error: authErr } =
          await supabase.auth.admin.updateUserById(userId, {
            email: fields.email,
          });
        if (authErr) {
          console.error("Auth email update error:", authErr);
        }
      }

      return new Response(
        JSON.stringify({ success: true, updated: updatePayload }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // --- DELETE ---
    if (action === "delete") {
      // Cascading delete in order: audit_logs, notifications, nullify test_drives.created_by, public.users, auth.users

      // 1. Delete audit_logs
      await fetch(
        `${DEMOLIGHT_URL}/rest/v1/audit_logs?user_id=eq.${userId}`,
        {
          method: "DELETE",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            Prefer: "return=minimal",
          },
        }
      );

      // 2. Delete notifications
      await fetch(
        `${DEMOLIGHT_URL}/rest/v1/notifications?user_id=eq.${userId}`,
        {
          method: "DELETE",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            Prefer: "return=minimal",
          },
        }
      );

      // 3. Nullify test_drives.created_by
      await fetch(
        `${DEMOLIGHT_URL}/rest/v1/test_drives?created_by=eq.${userId}`,
        {
          method: "PATCH",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ created_by: null }),
        }
      );

      // 4. Delete public.users row
      const delRes = await fetch(
        `${DEMOLIGHT_URL}/rest/v1/users?id=eq.${userId}`,
        {
          method: "DELETE",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            Prefer: "return=minimal",
          },
        }
      );

      if (!delRes.ok) {
        const errText = await delRes.text();
        throw new Error(
          `Delete public.users failed: ${delRes.status} ${errText}`
        );
      }

      // 5. Delete auth user
      const { error: authDeleteErr } =
        await supabase.auth.admin.deleteUser(userId);
      if (authDeleteErr) {
        console.error("Auth delete error:", authDeleteErr);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- RESET PASSWORD ---
    if (action === "reset-password") {
      // Get user email from Demolight
      const userRes = await fetch(
        `${DEMOLIGHT_URL}/rest/v1/users?id=eq.${userId}&select=email,phone`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        }
      );

      if (!userRes.ok) {
        throw new Error("Failed to fetch user");
      }

      const users = await userRes.json();
      if (!users || users.length === 0) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const user = users[0];

      // Generate recovery link via admin API
      const { data: linkData, error: linkErr } =
        await supabase.auth.admin.generateLink({
          type: "recovery",
          email: user.email,
          options: {
            redirectTo: "https://demolight.app/reset-password",
          },
        });

      if (linkErr || !linkData?.properties?.action_link) {
        throw new Error(
          linkErr?.message || "Failed to generate recovery link"
        );
      }

      const resetUrl = linkData.properties.action_link;

      // Send SMS via Twilio
      const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (!twilioSid || !twilioAuth || !twilioPhone) {
        return new Response(
          JSON.stringify({ error: "Twilio not configured" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!user.phone) {
        return new Response(
          JSON.stringify({ error: "User has no phone number" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Normalize phone to E.164
      let phone = user.phone.replace(/\D/g, "");
      if (phone.length === 10) phone = `+1${phone}`;
      else if (phone.length === 11 && phone.startsWith("1"))
        phone = `+${phone}`;
      else phone = `+${phone}`;

      const smsRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization:
              "Basic " + btoa(`${twilioSid}:${twilioAuth}`),
          },
          body: new URLSearchParams({
            To: phone,
            From: twilioPhone,
            Body: `Your Demolight password reset link: ${resetUrl}`,
          }),
        }
      );

      if (!smsRes.ok) {
        const smsErr = await smsRes.text();
        throw new Error(`Twilio SMS failed: ${smsRes.status} ${smsErr}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("manage-demolight-user error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
