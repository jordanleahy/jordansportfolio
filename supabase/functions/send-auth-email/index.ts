import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailRequest {
  email: string;
  type: 'signup' | 'login' | 'reset';
  magicLink?: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type, magicLink, name }: AuthEmailRequest = await req.json();

    let subject: string;
    let html: string;

    switch (type) {
      case 'signup':
        subject = "Welcome! Confirm your email";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">Welcome to Jordan Leahy's Platform!</h1>
            <p style="color: #666; font-size: 16px;">Hi${name ? ` ${name}` : ''},</p>
            <p style="color: #666; font-size: 16px;">Thank you for signing up! Please confirm your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Confirm Email</a>
            </div>
            <p style="color: #999; font-size: 14px;">If the button doesn't work, copy and paste this link: ${magicLink}</p>
            <p style="color: #999; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
          </div>
        `;
        break;

      case 'login':
        subject = "Sign in to your account";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">Sign In Request</h1>
            <p style="color: #666; font-size: 16px;">Hi${name ? ` ${name}` : ''},</p>
            <p style="color: #666; font-size: 16px;">Click the button below to sign in to your account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Sign In</a>
            </div>
            <p style="color: #999; font-size: 14px;">If the button doesn't work, copy and paste this link: ${magicLink}</p>
            <p style="color: #999; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `;
        break;

      case 'reset':
        subject = "Reset your password";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">Password Reset</h1>
            <p style="color: #666; font-size: 16px;">Hi${name ? ` ${name}` : ''},</p>
            <p style="color: #666; font-size: 16px;">You requested to reset your password. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #999; font-size: 14px;">If the button doesn't work, copy and paste this link: ${magicLink}</p>
            <p style="color: #999; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `;
        break;

      default:
        throw new Error('Invalid email type');
    }

    const emailResponse = await resend.emails.send({
      from: "Jordan Leahy <auth@jordanleahy.com>",
      to: [email],
      subject: subject,
      html: html,
    });

    console.log("Authentication email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-auth-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);