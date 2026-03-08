import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateAdminUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  role: 'admin' | 'manager' | 'user' | 'salesperson';
  accountType: 'starter' | 'professional';
  app: string;
  dealershipName?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { firstName, lastName, email, mobile, role, accountType, app, dealershipName }: CreateAdminUserRequest = await req.json();

    if (!firstName || !lastName || !email || !role || !accountType || !app) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate Demolight-specific requirements
    if (app === 'Demolight' && !dealershipName) {
      return new Response(JSON.stringify({ error: "Dealership name is required for Demolight users" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user already exists
    const { data: existingUsers } = await serviceClient.auth.admin.listUsers();
    const userExists = existingUsers?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (userExists) {
      return new Response(JSON.stringify({ error: "A user with this email already exists" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a temporary password (user will be required to reset it)
    const tempPassword = generateTemporaryPassword();

    // Create user in auth
    const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        app: app
      }
    });

    if (authError) {
      console.error("Auth user creation error:", authError);
      return new Response(JSON.stringify({ error: "Failed to create user account" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!authUser.user) {
      return new Response(JSON.stringify({ error: "Failed to create user account" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user record in wt_users
    const { error: wtUserError } = await serviceClient
      .from("wt_users")
      .insert({
        id: authUser.user.id,
        role: role,
        display_name: `${firstName} ${lastName}`,
        mobile_phone: mobile || null,
        dealership_name: dealershipName || null,
        account_type: accountType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (wtUserError) {
      console.error("wt_users insert error:", wtUserError);
      
      // Rollback: delete the auth user we just created
      await serviceClient.auth.admin.deleteUser(authUser.user.id);
      
      return new Response(JSON.stringify({ error: "Failed to create user profile" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate confirmation link for first login
    const { data: resetData, error: resetError } = await serviceClient.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `https://watchtower.dev/reset-password?app=${encodeURIComponent(app)}`
      }
    });

    let confirmationLink = null;
    if (!resetError && resetData?.properties?.action_link) {
      confirmationLink = resetData.properties.action_link;
    }

    // Send welcome email
    try {
      const welcomeEmailRes = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-welcome-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            userId: authUser.user.id,
            userEmail: email,
            userName: `${firstName} ${lastName}`,
            appName: app,
            dealershipName: dealershipName,
            accountType: accountType,
            confirmationLink: confirmationLink
          }),
        }
      );

      if (!welcomeEmailRes.ok) {
        console.warn("Failed to send welcome email:", await welcomeEmailRes.text());
      }
    } catch (emailErr) {
      console.warn("Welcome email error:", emailErr);
      // Don't fail the whole operation if email fails
    }

    // Force password reset on first login by updating the user
    await serviceClient.auth.admin.updateUserById(authUser.user.id, {
      password: generateTemporaryPassword(), // Force password change
      user_metadata: {
        ...authUser.user.user_metadata,
        requires_password_reset: true,
        account_type: accountType,
        dealership_name: dealershipName
      }
    });

    return new Response(JSON.stringify({ 
      success: true,
      user_id: authUser.user.id,
      email: email,
      message: "Admin user created successfully. Welcome email sent.",
      confirmation_link: confirmationLink ? "Email includes confirmation link" : "No confirmation link generated"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Create admin user error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateTemporaryPassword(): string {
  // Generate a secure 16-character temporary password
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}