import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendPasswordResetRequest {
  email: string;
  action: 'send_reset' | 'delete_user';
}

interface VerifyPasswordResetRequest {
  email: string;
  code: string;
  newPassword?: string;
  action: 'verify_reset' | 'confirm_delete';
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action } = body;

    if (action === 'send_reset' || action === 'delete_user') {
      return await handleSendReset(serviceClient, body as SendPasswordResetRequest);
    } else if (action === 'verify_reset' || action === 'confirm_delete') {
      return await handleVerifyReset(serviceClient, body as VerifyPasswordResetRequest);
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("Enhanced password reset error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleSendReset(serviceClient: any, { email, action }: SendPasswordResetRequest) {
  if (!email) {
    return new Response(JSON.stringify({ error: "Email required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Look up user by email
  const { data: { users }, error: listError } = await serviceClient.auth.admin.listUsers();
  if (listError) {
    console.error("List users error:", listError);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const user = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    // Return success anyway to prevent email enumeration
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Get user's mobile phone from wt_users
  const { data: wtUser, error: wtError } = await serviceClient
    .from("wt_users")
    .select("mobile_phone, mfa_phone")
    .eq("id", user.id)
    .single();

  const phoneNumber = wtUser?.mobile_phone || wtUser?.mfa_phone;
  if (wtError || !phoneNumber) {
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

  // Store new code with appropriate type
  const codeType = action === 'delete_user' ? 'password_reset' : 'password_reset';
  const { error: insertError } = await serviceClient
    .from("wt_mfa_codes")
    .insert({ 
      user_id: user.id, 
      code, 
      expires_at: expiresAt, 
      code_type: codeType,
      phone_used: phoneNumber 
    });

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

  const messageText = action === 'delete_user' 
    ? `Your account deletion verification code is ${code}. It expires in 10 minutes. Reply STOP to cancel.`
    : `Your Watchtower password reset code is ${code}. It expires in 10 minutes.`;

  const twilioRes = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      },
      body: new URLSearchParams({
        To: phoneNumber,
        From: fromNumber,
        Body: messageText,
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
  const maskedPhone = `(***) ***-${phoneNumber.slice(-4)}`;

  return new Response(JSON.stringify({ 
    success: true, 
    phone_hint: maskedPhone,
    action_type: action 
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleVerifyReset(serviceClient: any, { email, code, newPassword, action }: VerifyPasswordResetRequest) {
  if (!email || !code) {
    return new Response(JSON.stringify({ error: "Email and code required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === 'verify_reset' && !newPassword) {
    return new Response(JSON.stringify({ error: "New password required for password reset" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Look up user by email
  const { data: { users }, error: listError } = await serviceClient.auth.admin.listUsers();
  if (listError) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const user = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify code
  const { data: codeData, error: codeError } = await serviceClient
    .from("wt_mfa_codes")
    .select("*")
    .eq("user_id", user.id)
    .eq("code", code)
    .eq("used", false)
    .eq("code_type", "password_reset")
    .gte("expires_at", new Date().toISOString())
    .single();

  if (codeError || !codeData) {
    return new Response(JSON.stringify({ error: "Invalid or expired code" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Mark code as used
  await serviceClient
    .from("wt_mfa_codes")
    .update({ used: true })
    .eq("id", codeData.id);

  if (action === 'verify_reset') {
    // Reset password
    const { error: updateError } = await serviceClient.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Password update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update password" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Password updated successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } else if (action === 'confirm_delete') {
    // Delete user from auth and all related data
    try {
      // First delete user from wt_users
      await serviceClient
        .from("wt_users")
        .delete()
        .eq("id", user.id);

      // Delete user from auth (this will cascade to other tables)
      const { error: deleteError } = await serviceClient.auth.admin.deleteUser(user.id);

      if (deleteError) {
        console.error("User deletion error:", deleteError);
        return new Response(JSON.stringify({ error: "Failed to delete user" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, message: "User deleted successfully" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (deleteErr) {
      console.error("User deletion error:", deleteErr);
      return new Response(JSON.stringify({ error: "Failed to delete user" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}