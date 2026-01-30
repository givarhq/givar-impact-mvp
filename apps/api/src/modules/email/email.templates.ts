export const EmailTemplates = {
  base: (content: string, title: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background-color: #10b981; padding: 30px; text-align: center; }
          .logo { font-size: 24px; font-weight: 800; color: white; letter-spacing: -0.025em; text-decoration: none; }
          .content { padding: 40px 30px; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .button { display: inline-block; padding: 14px 28px; background-color: #10b981; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; margin-top: 20px; }
          h1 { margin-top: 0; color: #18181b; font-size: 24px; letter-spacing: -0.025em; }
          p { margin-bottom: 16px; color: #52525b; }
          .stat-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Givar.</div>
          </div>
          <div class="content">
            <h1>${title}</h1>
            ${content}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Givar Inc. Transparent Giving.<br>
            Lagos, Nigeria.</p>
          </div>
        </div>
      </body>
    </html>
  `,

  verification: (url: string, name: string) => `
    <p>Hi ${name},</p>
    <p>Welcome to Givar. To ensure the security of your impact wallet, please verify your email address.</p>
    <p>This link will expire in 24 hours.</p>
    <div style="text-align: center;">
      <a href="${url}" class="button">Verify Email Address</a>
    </div>
    <p style="margin-top: 30px; font-size: 12px; color: #999;">If you didn't create an account, you can safely ignore this email.</p>
  `,

  receipt: (data: { amount: string; currency: string; project: string; date: string; ref: string }) => `
    <p>Your donation has been verified and recorded on the public ledger.</p>
    <div class="stat-box">
      <div style="font-size: 12px; text-transform: uppercase; color: #15803d; font-weight: 700;">Amount</div>
      <div style="font-size: 24px; font-weight: 800; color: #14532d;">${data.currency} ${data.amount}</div>
      <div style="margin-top: 10px; font-size: 12px; text-transform: uppercase; color: #15803d; font-weight: 700;">Beneficiary</div>
      <div style="font-size: 16px; font-weight: 600;">${data.project}</div>
    </div>
    <p><strong>Reference:</strong> <span style="font-family: monospace;">${data.ref}</span></p>
    <p>Thank you for making a difference.</p>
  `,

  securityAlert: (data: { ip: string; time: string }) => `
    <p>We detected a new login to your Givar account.</p>
    <ul>
      <li><strong>Time:</strong> ${data.time}</li>
      <li><strong>IP Address:</strong> ${data.ip}</li>
    </ul>
    <p>If this was you, no action is needed. If not, please contact support immediately.</p>
  `,

  subscriptionUpdate: (data: { name: string; project: string; status: string }) => `
    <p>Hi ${data.name},</p>
    <p>This is a notification regarding your recurring donation to <strong>${data.project}</strong>.</p>
    <div class="stat-box" style="text-align: center;">
      <div style="font-size: 12px; text-transform: uppercase; color: #15803d; font-weight: 700;">New Status</div>
      <div style="font-size: 24px; font-weight: 800; color: ${data.status === 'ACTIVE' ? '#10b981' : '#f59e0b'};">
        ${data.status}
      </div>
    </div>
    <p>
      ${data.status === 'ACTIVE' 
        ? 'Your automated impact has been resumed. Thank you for your continued support.' 
        : 'Your automated impact has been paused. No further charges will be made until you resume.'}
    </p>
    <p>You can manage all your subscriptions from your dashboard at any time.</p>
  `,
};