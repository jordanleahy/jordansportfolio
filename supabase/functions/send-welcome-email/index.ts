import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

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

    const emailResponse = await resend.emails.send({
      from: "Your App <onboarding@resend.dev>", // Replace with your verified domain
      to: [userEmail],
      subject: `Welcome to ${planName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to Your Subscription!</h1>
          ${userName ? `<p>Hi ${userName},</p>` : '<p>Hi there,</p>'}
          
          <p>Thank you for subscribing to our <strong>${planName}</strong>!</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your Plan Includes:</h3>
            <ul>
              <li>100 AI Image Generations per month</li>
              <li>10 DALL-E 3 Images per month</li>
              <li>Unlimited Text Generations</li>
              <li>Priority Support</li>
            </ul>
          </div>
          
          <p>You can track your usage and manage your subscription anytime in your dashboard.</p>
          
          <a href="https://your-app-url.com/subscription" 
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            View Dashboard
          </a>
          
          <p>If you have any questions, feel free to reach out to our support team.</p>
          
          <p>Best regards,<br>Your App Team</p>
        </div>
      `,
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