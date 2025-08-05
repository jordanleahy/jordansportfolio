import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createEmailTemplate } from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  userEmail: string;
  resetUrl: string;
  userName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, resetUrl, userName }: PasswordResetRequest = await req.json();

    console.log('Sending password reset email to:', userEmail);

    const emailContent = createEmailTemplate({
      title: "Reset Your Password",
      preheader: "Reset your password to regain access to your account",
      content: `
        <h2>Password Reset Request 🔐</h2>
        <p>Hi${userName ? ` ${userName}` : ''},</p>
        <p>We received a request to reset your password. If you made this request, click the button below to create a new password.</p>
        
        <div class="highlight">
          <p><strong>🔒 Security Notice</strong></p>
          <p>For your security, this password reset link will expire in 1 hour. If you don't reset your password within this time, you'll need to request a new reset link.</p>
        </div>
        
        <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
        
        <p><strong>Tips for a strong password:</strong></p>
        <ul style="margin-left: 20px; margin-bottom: 16px;">
          <li>Use at least 8 characters</li>
          <li>Include uppercase and lowercase letters</li>
          <li>Add numbers and special characters</li>
          <li>Avoid common words or personal information</li>
        </ul>
      `,
      ctaButton: {
        text: "Reset Password",
        url: resetUrl
      },
      footerText: "If the button doesn't work, copy and paste this link into your browser: " + resetUrl
    });

    const emailResponse = await resend.emails.send({
      from: "Your App <security@jordanleahy.com>",
      to: [userEmail],
      subject: "Reset your password",
      html: emailContent,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);