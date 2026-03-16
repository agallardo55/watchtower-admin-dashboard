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
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up user by email
    const { data: { users }, error: listError } = await serviceClient.auth.admin.listUsers();
    if (listError) {
      console.error("List users error:", listError);
      return new Response(JSON.stringify({ error: "Internal error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      // Return success anyway to prevent email enumeration
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get MFA phone from wt_users
    const { data: wtUser, error: wtError } = await serviceClient
      .from("wt_users")
      .select("mfa_phone")
      .eq("id", user.id)
      .single();

    if (wtError || !wtUser?.mfa_phone) {
      // No phone on file — can't send SMS, but don't reveal this
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    // Invalidate existing codes for this user
    await serviceClient
      .from("wt_mfa_codes")
      .update({ used: true })
      .eq("user_id", user.id)
      .eq("used", false);

    // Store new code
    const { error: insertError } = await serviceClient
      .from("wt_mfa_codes")
      .insert({ user_id: user.id, code, expires_at: expiresAt });

    if (insertError) {
      console.error("Insert code error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to generate code" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send SMS via Twilio
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const fromNumber = Deno.env.get("TWILIO_FROM_NUMBER")!;

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        },
        body: new URLSearchParams({
          To: wtUser.mfa_phone,
          From: fromNumber,
          Body: `Your Watchtower password reset code is ${code}. It expires in 10 minutes.`,
        }),
      }
    );

    if (!twilioRes.ok) {
      const twilioError = await twilioRes.text();
      console.error("Twilio error:", twilioError);
      return new Response(JSON.stringify({ error: "Failed to send code" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return masked phone hint
    const phone = wtUser.mfa_phone;
    const maskedPhone = `(***) ***-${phone.slice(-4)}`;

    return new Response(JSON.stringify({ success: true, phone_hint: maskedPhone }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
