import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEMOLIGHT_URL = "https://owjvzqtfiyfnrdtsumqa.supabase.co";

// Branded email template matching Demolight's existing invite email pattern
function buildInviteEmailHtml(params: {
  dealershipName: string;
  role: string;
  resetUrl: string;
}) {
  const { dealershipName, role, resetUrl } = params;
  const BRAND = {
    primary: "#1D4ED8",
    navy: "#1E293B",
    gray: "#64748B",
    lightGray: "#94A3B8",
    border: "#E2E8F0",
    bg: "#F8FAFC",
    white: "#FFFFFF",
  };

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: ${BRAND.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 40px auto; background: ${BRAND.white}; border-radius: 12px; border: 1px solid ${BRAND.border}; overflow: hidden;">
    <div style="padding: 40px 32px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <img src="https://demolight.app/logo-email@2x.png" alt="Demolight" width="200" height="48" style="display: inline-block; border: 0; outline: none;" />
      </div>
      <h1 style="font-size: 20px; color: ${BRAND.navy}; margin: 0 0 4px;">You're Invited</h1>
      <p style="color: ${BRAND.gray}; margin: 4px 0 24px; font-size: 15px;">
        You've been invited to join <strong>${dealershipName}</strong> on Demolight.
      </p>
      <hr style="border: none; border-top: 1px solid ${BRAND.border}; margin: 24px 0;" />
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; color: ${BRAND.lightGray}; font-size: 14px; width: 140px; vertical-align: top;">Dealership</td>
          <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.navy}; font-weight: 600;">${dealershipName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${BRAND.lightGray}; font-size: 14px; width: 140px; vertical-align: top;">Role</td>
          <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.navy};">${roleLabel}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${BRAND.lightGray}; font-size: 14px; width: 140px; vertical-align: top;">Email</td>
          <td style="padding: 8px 0; font-size: 14px; color: ${BRAND.navy};">Use the email this was sent to</td>
        </tr>
      </table>
      <hr style="border: none; border-top: 1px solid ${BRAND.border}; margin: 24px 0;" />
      <p style="color: ${BRAND.gray}; font-size: 14px; text-align: center;">Set your password to get started:</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: ${BRAND.primary}; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Set Password & Log In</a>
      </div>
      <p style="color: ${BRAND.lightGray}; font-size: 12px; text-align: center;">This link expires in 24 hours. If you didn't expect this invite, you can safely ignore this email.</p>
    </div>
    <div style="background: ${BRAND.bg}; padding: 20px 32px; border-top: 1px solid ${BRAND.border}; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: ${BRAND.lightGray};">
        Powered by <a href="https://demolight.app" style="color: ${BRAND.primary}; text-decoration: none;">Demolight</a> — Test drive management, simplified.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

function phoneToDb(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }
  if (digits.length !== 10) return phone;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, role, dealershipName, plan } =
      body;

    if (!firstName || !lastName || !email || !phone || !role || !dealershipName) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
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

    // 1. Check if dealership exists by name, create if not
    const dealershipRes = await fetch(
      `${DEMOLIGHT_URL}/rest/v1/dealerships?name=eq.${encodeURIComponent(dealershipName)}&select=id,name`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );

    if (!dealershipRes.ok) {
      throw new Error("Failed to query dealerships");
    }

    const dealerships = await dealershipRes.json();
    let dealershipId: string;

    if (dealerships.length > 0) {
      dealershipId = dealerships[0].id;
    } else {
      // Create new dealership
      const now = new Date();
      const trialEnds = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const newDealership: Record<string, unknown> = {
        name: dealershipName,
        subscription_status: "trialing",
        trial_ends_at: trialEnds.toISOString(),
      };
      if (plan) {
        newDealership.plan = plan;
      }

      const createRes = await fetch(
        `${DEMOLIGHT_URL}/rest/v1/dealerships`,
        {
          method: "POST",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(newDealership),
        }
      );

      if (!createRes.ok) {
        const errText = await createRes.text();
        throw new Error(
          `Failed to create dealership: ${createRes.status} ${errText}`
        );
      }

      const created = await createRes.json();
      dealershipId = created[0].id;
    }

    // 2. Create auth user with random password + email_confirm: true
    const temporaryPassword = `${crypto.randomUUID()}Aa1!`;
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          phone: normalizePhone(phone),
          dealership_id: dealershipId,
          role: role,
        },
      });

    if (authError) {
      if (
        authError.message.includes("already been registered") ||
        authError.message.includes("already exists")
      ) {
        return new Response(
          JSON.stringify({ error: "A user with this email already exists" }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error("Failed to create auth user");
    }

    // 3. Create public.users row
    const { error: insertError } = await supabase.from("users").insert({
      id: authData.user.id,
      email: email.toLowerCase(),
      first_name: firstName,
      last_name: lastName,
      phone: phoneToDb(phone),
      role: role,
      dealership_id: dealershipId,
      is_active: true,
    });

    if (insertError) {
      // Rollback auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create user profile: ${insertError.message}`);
    }

    // 4. Send welcome email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      // Generate a password reset link so they can set their own password
      let resetUrl = "https://demolight.app/reset-password?invite=true";
      try {
        const { data: linkData } = await supabase.auth.admin.generateLink({
          type: "recovery",
          email: email.toLowerCase(),
          options: {
            redirectTo: "https://demolight.app/reset-password?invite=true",
          },
        });
        if (linkData?.properties?.action_link) {
          resetUrl = linkData.properties.action_link;
        }
      } catch (linkErr) {
        console.error("Failed to generate reset link:", linkErr);
      }

      try {
        const html = buildInviteEmailHtml({
          dealershipName,
          role,
          resetUrl,
        });

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Demolight <noreply@demolight.app>",
            to: email.toLowerCase(),
            subject: `You're invited to ${dealershipName} on Demolight`,
            html,
          }),
        });

        if (!emailResponse.ok) {
          console.error(
            "Resend invite email failed:",
            await emailResponse.text()
          );
        }
      } catch (emailErr) {
        console.error("Failed to send invite email:", emailErr);
      }
    }

    // 5. Return created user data
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: email.toLowerCase(),
          firstName,
          lastName,
          phone,
          role,
          dealershipId,
          dealershipName,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("create-demolight-user error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
