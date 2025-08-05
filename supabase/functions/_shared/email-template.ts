// Shared email template utilities for consistent styling across all system emails

export interface EmailTemplateData {
  title: string;
  preheader?: string;
  content: string;
  ctaButton?: {
    text: string;
    url: string;
  };
  footerText?: string;
}

export const createEmailTemplate = (data: EmailTemplateData): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #334155;
      background-color: #f8fafc;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    }
    
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      padding: 40px 30px;
      text-align: center;
    }
    
    .header h1 {
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.025em;
    }
    
    .header .tagline {
      color: #e2e8f0;
      font-size: 16px;
      font-weight: 400;
    }
    
    .content {
      padding: 40px 30px;
    }
    
    .content h2 {
      color: #1e293b;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;
      line-height: 1.3;
    }
    
    .content p {
      margin-bottom: 16px;
      font-size: 16px;
      line-height: 1.6;
    }
    
    .content .highlight {
      background-color: #f1f5f9;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #2563eb;
      margin: 24px 0;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
      transition: all 0.3s ease;
    }
    
    .cta-button:hover {
      background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
    }
    
    .footer {
      background-color: #f8fafc;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer p {
      color: #64748b;
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .footer .company-info {
      color: #94a3b8;
      font-size: 12px;
      margin-top: 16px;
    }
    
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%);
      margin: 32px 0;
    }
    
    @media (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      
      .header, .content, .footer {
        padding: 30px 20px;
      }
      
      .header h1 {
        font-size: 24px;
      }
      
      .content h2 {
        font-size: 20px;
      }
      
      .cta-button {
        padding: 14px 28px;
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  ${data.preheader ? `<div style="display: none; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all;">${data.preheader}</div>` : ''}
  
  <div style="padding: 20px 0;">
    <div class="email-container">
      <div class="header">
        <h1>Your App</h1>
        <div class="tagline">Professional AI-Powered Platform</div>
      </div>
      
      <div class="content">
        ${data.content}
        
        ${data.ctaButton ? `
        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.ctaButton.url}" class="cta-button">${data.ctaButton.text}</a>
        </div>
        ` : ''}
      </div>
      
      <div class="footer">
        <p><strong>Need help?</strong> Reply to this email or contact our support team.</p>
        <div class="divider"></div>
        <div class="company-info">
          ${data.footerText || 'This email was sent from Your App. Please do not reply to this email.'}
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};