import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userId: string;
  userEmail: string;
  userName: string;
  appName: string;
  dealershipName?: string;
  accountType?: string;
  confirmationLink?: string;
}

// Email templates for different apps
const getEmailTemplate = (appName: string, userName: string, dealershipName?: string, accountType?: string, confirmationLink?: string) => {
  const baseTemplate = {
    from: "Watchtower Admin <noreply@watchtower.dev>",
    subject: `Welcome to ${appName}!`,
  };

  if (appName === 'Demolight') {
    return {
      ...baseTemplate,
      subject: `Welcome to Demolight${dealershipName ? ` - ${dealershipName}` : ''}!`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Demolight</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; }
    .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .welcome-text { font-size: 18px; color: #1e293b; margin-bottom: 24px; }
    .info-card { background-color: #f1f5f9; padding: 24px; border-radius: 8px; margin: 24px 0; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
    .info-label { font-weight: 600; color: #475569; }
    .info-value { color: #1e293b; }
    .cta-button { 
      display: inline-block; 
      background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
      color: white; 
      padding: 14px 32px; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: 600; 
      margin: 24px 0; 
    }
    .footer { background-color: #f8fafc; padding: 30px; text-align: center; font-size: 14px; color: #64748b; }
    .accent { color: #3b82f6; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚗 Welcome to Demolight</h1>
    </div>
    <div class="content">
      <p class="welcome-text">Hi ${userName}!</p>
      <p>Welcome to <span class="accent">Demolight</span> – your streamlined demo and vehicle showcase tool. We're excited to have you on board!</p>
      
      ${dealershipName || accountType ? `
      <div class="info-card">
        <h3 style="margin-top: 0; color: #1e293b;">Account Information</h3>
        ${dealershipName ? `
        <div class="info-row">
          <span class="info-label">Dealership:</span>
          <span class="info-value">${dealershipName}</span>
        </div>
        ` : ''}
        ${accountType ? `
        <div class="info-row">
          <span class="info-label">Account Type:</span>
          <span class="info-value">${accountType.charAt(0).toUpperCase() + accountType.slice(1)}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-value">${userEmail}</span>
        </div>
      </div>
      ` : ''}

      ${confirmationLink ? `
      <p>To complete your account setup, please click the button below:</p>
      <a href="${confirmationLink}" class="cta-button">Confirm Your Account</a>
      ` : `
      <p>Your account is now active and ready to use!</p>
      <a href="https://demolight.com/dashboard" class="cta-button">Access Your Dashboard</a>
      `}

      <h3>What's Next?</h3>
      <ul style="color: #475569; line-height: 1.6;">
        <li>Set up your vehicle showcase preferences</li>
        <li>Upload your first vehicle demo content</li>
        <li>Customize your demo presentation templates</li>
        <li>Invite your team members to collaborate</li>
      </ul>

      <p style="color: #64748b; margin-top: 32px;">
        Need help getting started? Reply to this email or contact our support team at 
        <a href="mailto:support@demolight.com" style="color: #3b82f6;">support@demolight.com</a>
      </p>
    </div>
    <div class="footer">
      <p>This email was sent by Watchtower Admin on behalf of Demolight.</p>
      <p style="margin-top: 8px;">
        <a href="https://demolight.com" style="color: #3b82f6;">Demolight.com</a> | 
        <a href="mailto:support@demolight.com" style="color: #3b82f6;">Support</a>
      </p>
    </div>
  </div>
</body>
</html>
      `,
      text: `Welcome to Demolight!

Hi ${userName}!

Welcome to Demolight – your streamlined demo and vehicle showcase tool. We're excited to have you on board!

${dealershipName ? `Dealership: ${dealershipName}` : ''}
${accountType ? `Account Type: ${accountType.charAt(0).toUpperCase() + accountType.slice(1)}` : ''}
Email: ${userEmail}

${confirmationLink ? `To complete your account setup, visit: ${confirmationLink}` : 'Your account is now active and ready to use! Visit: https://demolight.com/dashboard'}

What's Next?
- Set up your vehicle showcase preferences
- Upload your first vehicle demo content  
- Customize your demo presentation templates
- Invite your team members to collaborate

Need help? Contact us at support@demolight.com

Best regards,
The Demolight Team`
    };
  }

  // Default template for other apps
  return {
    ...baseTemplate,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${appName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; }
    .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .welcome-text { font-size: 18px; color: #1e293b; margin-bottom: 24px; }
    .cta-button { 
      display: inline-block; 
      background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
      color: white; 
      padding: 14px 32px; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: 600; 
      margin: 24px 0; 
    }
    .footer { background-color: #f8fafc; padding: 30px; text-align: center; font-size: 14px; color: #64748b; }
    .accent { color: #3b82f6; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to ${appName}</h1>
    </div>
    <div class="content">
      <p class="welcome-text">Hi ${userName}!</p>
      <p>Welcome to <span class="accent">${appName}</span>! Your account has been successfully created and is ready to use.</p>
      
      <p>Email: ${userEmail}</p>

      ${confirmationLink ? `
      <p>To complete your account setup, please click the button below:</p>
      <a href="${confirmationLink}" class="cta-button">Confirm Your Account</a>
      ` : `
      <p>Your account is now active and ready to use!</p>
      <a href="#" class="cta-button">Get Started</a>
      `}

      <p style="color: #64748b; margin-top: 32px;">
        Need help? Contact our support team for assistance.
      </p>
    </div>
    <div class="footer">
      <p>This email was sent by Watchtower Admin on behalf of ${appName}.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Welcome to ${appName}!

Hi ${userName}!

Welcome to ${appName}! Your account has been successfully created and is ready to use.

Email: ${userEmail}

${confirmationLink ? `To complete your account setup, visit: ${confirmationLink}` : 'Your account is now active and ready to use!'}

Need help? Contact our support team for assistance.

Best regards,
The ${appName} Team`
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, userEmail, userName, appName, dealershipName, accountType, confirmationLink }: WelcomeEmailRequest = await req.json();

    if (!userId || !userEmail || !userName || !appName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get email template
    const emailTemplate = getEmailTemplate(appName, userName, dealershipName, accountType, confirmationLink);

    // Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Resend API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: emailTemplate.from,
        to: [userEmail],
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
        tags: [
          { name: "app", value: appName },
          { name: "email_type", value: "welcome" }
        ]
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      console.error("Resend error:", resendError);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendResult = await resendResponse.json();

    // Log email delivery to database
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await serviceClient
      .from("wt_email_deliveries")
      .insert({
        user_id: userId,
        email_type: "welcome",
        recipient_email: userEmail,
        status: "sent",
        resend_message_id: resendResult.id,
      });

    return new Response(JSON.stringify({ 
      success: true, 
      message_id: resendResult.id,
      email_sent_to: userEmail 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Welcome email error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});