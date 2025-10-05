import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userEmail: string;
  username: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, username }: NotificationRequest = await req.json();

    // Get admin emails from user_roles table
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: adminRoles, error: adminError } = await supabaseClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (adminError) {
      console.error("Error fetching admin roles:", adminError);
      throw adminError;
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admin users found");
      return new Response(
        JSON.stringify({ message: "No admin users found" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get admin profiles
    const { data: adminProfiles, error: profileError } = await supabaseClient
      .from("profiles")
      .select("email")
      .in(
        "user_id",
        adminRoles.map((r) => r.user_id)
      );

    if (profileError) {
      console.error("Error fetching admin profiles:", profileError);
      throw profileError;
    }

    console.log(
      `New user registered: ${username} (${userEmail}). Admin notification logged.`
    );
    console.log(`Admin emails to notify: ${adminProfiles?.map((p) => p.email).join(", ")}`);

    // TODO: Implement actual email sending with Resend
    // For now, just log the notification
    // To implement: Add RESEND_API_KEY secret and use Resend to send emails

    return new Response(
      JSON.stringify({
        message: "Admin notification logged",
        admins: adminProfiles?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-admin-new-user function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
