/**
 * EDGE FUNCTION: Auth Email Webhook
 * 
 * PURPOSE:
 * Handles Supabase Auth webhook events for sending custom emails.
 * This function is triggered by Supabase Auth events like signup, password reset, etc.
 * 
 * WEBHOOK EVENTS:
 * - user.signed_up - Send welcome/confirmation email
 * - user.recovery.requested - Send password reset email
 * - user.email_changed - Send email change confirmation
 * 
 * SECURITY:
 * - Validates webhook signature using SUPABASE_WEBHOOK_SECRET
 * - Only processes authenticated webhook requests from Supabase
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@2.0.0";
import { createEmailTemplate } from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get("SUPABASE_WEBHOOK_SECRET") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // Verify webhook signature
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    const wh = new Webhook(hookSecret);
    let event;
    
    try {
      event = wh.verify(payload, headers);
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    console.log("Auth webhook event received:", event.type);

    // Handle different auth events
    switch (event.type) {
      case "user.signed_up":
        await handleSignupEmail(event);
        break;
      case "user.recovery.requested":
        await handlePasswordResetEmail(event);
        break;
      default:
        console.log("Unhandled webhook event type:", event.type);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Auth webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

async function handleSignupEmail(event: any) {
  const { user, email_data } = event;
  const { token_hash, redirect_to, email_action_type } = email_data;
  
  const confirmationUrl = `${Deno.env.get("SUPABASE_URL")}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;
  
  const userName = user.user_metadata?.first_name || user.email?.split('@')[0];
  
  console.log("Sending signup confirmation email to:", user.email);

  const emailContent = createEmailTemplate({
    title: "Welcome! Confirm Your Account",
    preheader: "Confirm your email to start using your account",
    content: `
      <h2>Welcome${userName ? `, ${userName}` : ''}! 🎉</h2>
      <p>Thanks for signing up! Please confirm your email address to activate your account and get started.</p>
      
      <div class="highlight">
        <p><strong>📚 Get Started</strong></p>
        <p>Once verified, you'll have full access to all features and can start using your account right away.</p>
      </div>
      
      <p>This confirmation link will expire in 24 hours for security reasons.</p>
      <p>If you didn't create this account, you can safely ignore this email.</p>
    `,
    ctaButton: {
      text: "Confirm Your Account",
      url: confirmationUrl
    },
    footerText: "If the button doesn't work, copy and paste this link into your browser: " + confirmationUrl
  });

  const emailResponse = await resend.emails.send({
    from: "Jordan Leahy <noreply@jordanleahy.com>",
    to: [user.email],
    subject: "Welcome! Please Confirm Your Account",
    html: emailContent,
  });

  console.log("Signup email sent successfully:", emailResponse);
}

async function handlePasswordResetEmail(event: any) {
  const { user, email_data } = event;
  const { token_hash, redirect_to, email_action_type } = email_data;
  
  const resetUrl = `${Deno.env.get("SUPABASE_URL")}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;
  
  const userName = user.user_metadata?.first_name || user.email?.split('@')[0];
  
  console.log("Sending password reset email to:", user.email);

  const emailContent = createEmailTemplate({
    title: "Reset Your Password",
    preheader: "Reset your password to regain access to your account",
    content: `
      <h2>Password Reset Request</h2>
      <p>Hi${userName ? ` ${userName}` : ''},</p>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      
      <div class="highlight">
        <p><strong>🔒 Secure Reset</strong></p>
        <p>This link will securely redirect you to create a new password for your account.</p>
      </div>
      
      <p>This reset link will expire in 1 hour for security reasons.</p>
      <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
    `,
    ctaButton: {
      text: "Reset Password",
      url: resetUrl
    },
    footerText: "If the button doesn't work, copy and paste this link into your browser: " + resetUrl
  });

  const emailResponse = await resend.emails.send({
    from: "Jordan Leahy <noreply@jordanleahy.com>",
    to: [user.email],
    subject: "Reset Your Password",
    html: emailContent,
  });

  console.log("Password reset email sent successfully:", emailResponse);
}