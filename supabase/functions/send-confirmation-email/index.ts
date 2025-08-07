/**
 * EDGE FUNCTION: Send Confirmation Email
 * 
 * PURPOSE:
 * Sends account verification emails to new users during the registration process.
 * Creates professional, branded email confirmations with secure verification links
 * and engaging copy to encourage account activation and user onboarding.
 * 
 * INPUTS:
 * - userEmail: string - Recipient email address for verification
 * - confirmationUrl: string - Secure verification link with token
 * - userName: string (optional) - User's name for personalization
 * 
 * OUTPUTS:
 * - Success: Resend API response object with message delivery details
 * - Error: { error: string }
 * 
 * DEPENDENCIES:
 * - Resend API (email delivery service)
 * - Email Template System (shared template generator)
 * 
 * USAGE:
 * Called from: User registration flows, account creation processes, email verification systems
 * Authentication: Not required - triggered by system events
 * 
 * FLOW:
 * 1. Parse incoming email request with user details and confirmation URL
 * 2. Generate branded email template with verification content
 * 3. Include clear call-to-action button and expiration notice
 * 4. Send email via Resend API with professional sender identity
 * 5. Return delivery confirmation or error details
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createEmailTemplate } from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  userEmail: string;
  confirmationUrl: string;
  userName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, confirmationUrl, userName }: ConfirmationEmailRequest = await req.json();

    console.log('Sending confirmation email to:', userEmail);

    const emailContent = createEmailTemplate({
      title: "Start Generating Stories Now",
      preheader: "Confirm your email to begin creating amazing stories",
      content: `
        <h2>Welcome${userName ? `, ${userName}` : ''}! 🎉</h2>
        <p>You're one step away from creating incredible stories! Please confirm your email address to unlock your storytelling potential.</p>
        
        <div class="highlight">
          <p><strong>📚 Start Your Story Journey</strong></p>
          <p>Once verified, you'll have access to powerful story generation tools and can start creating captivating narratives instantly.</p>
        </div>
        
        <p>This confirmation link will expire in 24 hours for security reasons.</p>
        <p>If you didn't create this account, you can safely ignore this email.</p>
      `,
      ctaButton: {
        text: "Start Generating Stories Now",
        url: confirmationUrl
      },
      footerText: "If the button doesn't work, copy and paste this link into your browser: " + confirmationUrl
    });

    const emailResponse = await resend.emails.send({
      from: "Story Generator <noreply@jordanleahy.com>",
      to: [userEmail],
      subject: "Start Generating Stories Now - Confirm Your Account",
      html: emailContent,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);