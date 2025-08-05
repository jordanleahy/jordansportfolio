import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createEmailTemplate } from "../_shared/email-template.ts";

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
    
    const alertType = isNearLimit ? 'Critical Usage Alert' : 'Usage Warning';
    const alertEmoji = isNearLimit ? '🚨' : '⚠️';
    const urgencyText = isNearLimit ? 
      "You're almost at your limit! Consider upgrading your plan to continue using our services." : 
      "You're approaching your monthly limit. Consider monitoring your usage or upgrading your plan.";

    const emailContent = createEmailTemplate({
      title: `${alertType}: ${usageType}`,
      preheader: `${Math.round(percentageUsed)}% of your ${usageType} limit used`,
      content: `
        <h2>${alertEmoji} ${alertType}</h2>
        <p>Hi${userName ? ` ${userName}` : ''},</p>
        <p>You've used <strong>${Math.round(percentageUsed)}%</strong> of your monthly <strong>${usageType}</strong> limit.</p>
        
        <div class="highlight">
          <p><strong>📊 Usage Details:</strong></p>
          <p><strong>Current Usage:</strong> ${currentUsage} / ${limit}</p>
          <p><strong>Remaining:</strong> ${limit - currentUsage}</p>
          
          <div style="background-color: #e5e7eb; height: 12px; border-radius: 6px; overflow: hidden; margin: 12px 0;">
            <div style="background: ${isNearLimit ? 'linear-gradient(90deg, #dc2626, #ef4444)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)'}; height: 100%; width: ${percentageUsed}%; transition: width 0.3s ease; border-radius: 6px;"></div>
          </div>
        </div>
        
        <p style="color: ${isNearLimit ? '#dc2626' : '#f59e0b'}; font-weight: 600;">${urgencyText}</p>
        
        <p><strong>What you can do:</strong></p>
        <ul style="margin-left: 20px; margin-bottom: 16px;">
          <li>Monitor your usage in the dashboard</li>
          <li>Upgrade to a higher plan for more capacity</li>
          <li>Optimize your usage patterns</li>
          <li>Contact support for usage optimization tips</li>
        </ul>
      `,
      ctaButton: {
        text: "Manage Subscription",
        url: "https://jordanleahy.com/subscription"
      },
      footerText: "Your usage resets at the beginning of each billing cycle."
    });

    const emailResponse = await resend.emails.send({
      from: "Your App <alerts@jordanleahy.com>",
      to: [userEmail],
      subject: `${alertType}: ${usageType} at ${Math.round(percentageUsed)}%`,
      html: emailContent,
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