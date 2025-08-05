import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UsageAlertRequest {
  userEmail: string;
  userName?: string;
  usageType: string;
  currentUsage: number;
  limit: number;
  percentageUsed: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, usageType, currentUsage, limit, percentageUsed }: UsageAlertRequest = await req.json();

    console.log('Sending usage alert to:', userEmail, 'for:', usageType);

    const isWarning = percentageUsed >= 80;
    const isNearLimit = percentageUsed >= 95;
    
    const alertType = isNearLimit ? 'Critical' : 'Warning';
    const alertColor = isNearLimit ? '#dc2626' : '#f59e0b';

    const emailResponse = await resend.emails.send({
      from: "Your App <alerts@resend.dev>", // Replace with your verified domain
      to: [userEmail],
      subject: `${alertType}: ${usageType} Usage at ${Math.round(percentageUsed)}%`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${alertColor}; color: white; padding: 16px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">${alertType}: Usage Alert</h1>
          </div>
          
          <div style="border: 2px solid ${alertColor}; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
            ${userName ? `<p>Hi ${userName},</p>` : '<p>Hi there,</p>'}
            
            <p>You've used <strong>${Math.round(percentageUsed)}%</strong> of your monthly ${usageType} limit.</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Usage Details:</h3>
              <p><strong>Current Usage:</strong> ${currentUsage} / ${limit}</p>
              <p><strong>Remaining:</strong> ${limit - currentUsage}</p>
              
              <div style="background-color: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden;">
                <div style="background-color: ${alertColor}; height: 100%; width: ${percentageUsed}%; transition: width 0.3s ease;"></div>
              </div>
            </div>
            
            ${isNearLimit ? 
              '<p style="color: #dc2626;"><strong>You\'re almost at your limit!</strong> Consider upgrading your plan to continue using our services.</p>' : 
              '<p>Consider monitoring your usage or upgrading your plan if you need more capacity.</p>'
            }
            
            <a href="https://your-app-url.com/subscription" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Manage Subscription
            </a>
          </div>
        </div>
      `,
    });

    console.log("Usage alert sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending usage alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);