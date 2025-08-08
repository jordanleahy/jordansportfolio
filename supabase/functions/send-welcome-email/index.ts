import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createEmailTemplate } from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userEmail: string;
  userName?: string;
  planName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, planName }: WelcomeEmailRequest = await req.json();

    console.log('Sending welcome email to:', userEmail, 'for plan:', planName);

    const emailContent = createEmailTemplate({
      title: "Welcome to Your Subscription!",
      preheader: `Welcome to ${planName} - your AI-powered journey starts now!`,
      content: `
        <h2>Welcome${userName ? `, ${userName}` : ''}! 🚀</h2>
        <p>Thank you for subscribing to our <strong>${planName}</strong>! You're now part of an exclusive community using cutting-edge AI technology.</p>
        
        <div class="highlight">
          <p><strong>🎯 Your Plan Includes:</strong></p>
          <ul style="margin: 12px 0 0 20px;">
            <li><strong>100 AI Image Generations</strong> per month</li>
            <li><strong>10 High-Quality Image Generations</strong> per month</li>
            <li><strong>Unlimited Text Generations</strong></li>
            <li><strong>Priority Support</strong> & updates</li>
            <li><strong>Advanced Analytics</strong> dashboard</li>
          </ul>
        </div>
        
        <p>You can track your usage, manage your subscription, and explore all features in your personal dashboard.</p>
        
        <p><strong>Quick Start Tips:</strong></p>
        <ul style="margin-left: 20px; margin-bottom: 16px;">
          <li>Check your usage dashboard to monitor your monthly limits</li>
          <li>Explore our AI image generation tools</li>
          <li>Try our AI image generation for premium images</li>
          <li>Contact support anytime if you need help</li>
        </ul>
        
        <p>Welcome aboard, and let's create something amazing together!</p>
      `,
      ctaButton: {
        text: "Access Your Dashboard",
        url: "https://jordanleahy.com/subscription"
      },
      footerText: "Thank you for choosing our platform. We're excited to see what you'll create!"
    });

    const emailResponse = await resend.emails.send({
      from: "Story Generator <welcome@jordanleahy.com>",
      to: [userEmail],
      subject: `Welcome to ${planName} - Story Generator! 🎉`,
      html: emailContent,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);