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