interface PasswordResetTemplateData {
  userName?: string;
  resetUrl: string;
}

export const createPasswordResetTemplate = (data: PasswordResetTemplateData): string => {
  const { userName, resetUrl } = data;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Story Generator</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #334155;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 20px;
      color: #1e293b;
    }
    .message {
      font-size: 16px;
      margin-bottom: 30px;
      color: #475569;
    }
    .security-notice {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      margin: 30px 0;
      border-radius: 6px;
    }
    .security-notice h3 {
      margin: 0 0 10px 0;
      font-size: 16px;
      font-weight: 600;
      color: #92400e;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .security-notice p {
      margin: 0;
      font-size: 14px;
      color: #92400e;
    }
    .reset-button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #ffffff;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 20px 0;
      transition: transform 0.2s;
    }
    .reset-button:hover {
      transform: translateY(-1px);
    }
    .tips {
      background-color: #f1f5f9;
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
    }
    .tips h3 {
      margin: 0 0 15px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }
    .tips ul {
      margin: 0;
      padding-left: 20px;
      color: #475569;
    }
    .tips li {
      margin-bottom: 8px;
    }
    .footer {
      background-color: #f8fafc;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      margin: 0;
      font-size: 14px;
      color: #64748b;
    }
    .footer a {
      color: #6366f1;
      text-decoration: none;
    }
    .link-fallback {
      font-size: 14px;
      color: #64748b;
      margin-top: 20px;
      padding: 15px;
      background-color: #f8fafc;
      border-radius: 6px;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset</h1>
    </div>
    
    <div class="content">
      <div class="greeting">
        Hi${userName ? ` ${userName}` : ''}!
      </div>
      
      <div class="message">
        We received a request to reset your password for your Story Generator account. If you made this request, click the button below to create a new password.
      </div>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="reset-button">Reset My Password</a>
      </div>
      
      <div class="security-notice">
        <h3>🔒 Security Notice</h3>
        <p>For your security, this password reset link will expire in 1 hour. If you don't reset your password within this time, you'll need to request a new reset link.</p>
      </div>
      
      <div class="message">
        If you didn't request this password reset, please ignore this email. Your password will remain unchanged and your account is still secure.
      </div>
      
      <div class="tips">
        <h3>💡 Tips for a strong password:</h3>
        <ul>
          <li>Use at least 8 characters (12+ is even better)</li>
          <li>Include uppercase and lowercase letters</li>
          <li>Add numbers and special characters</li>
          <li>Avoid common words or personal information</li>
          <li>Consider using a password manager</li>
        </ul>
      </div>
      
      <div class="link-fallback">
        <strong>Button not working?</strong><br>
        Copy and paste this link into your browser:<br>
        <a href="${resetUrl}">${resetUrl}</a>
      </div>
    </div>
    
    <div class="footer">
      <p>
        This email was sent by <strong>Story Generator</strong><br>
        If you have any questions, please contact our support team.
      </p>
      <p style="margin-top: 15px;">
        <a href="mailto:support@storygenerator.com">support@storygenerator.com</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
};