export const EmailTemplates = {
  base: (content: string, title: string, logoUrl = 'https://givar.vercel.app/Givar1.png') => `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f0fdf4; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
          .wrapper { width: 100%; table-layout: fixed; background-color: #f0fdf4; padding-bottom: 40px; }
          .main { background-color: #ffffff; margin: 40px auto; width: 100%; max-width: 600px; border-radius: 24px; border: 1px solid #dcfce7; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
          .header { padding: 32px 40px; border-bottom: 1px solid #f0fdf4; }
          .logo-text { font-size: 22px; font-weight: 800; color: #064e3b; text-decoration: none; letter-spacing: -0.02em; }
          .content { padding: 40px; }
          .footer { padding: 32px; background-color: #f9fafb; text-align: center; border-top: 1px solid #f3f4f6; }
          .button { background-color: #10b981; color: #ffffff !important; padding: 16px 32px; border-radius: 14px; text-decoration: none; font-weight: 700; display: inline-block; }
          .stat-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 20px; padding: 24px; margin: 24px 0; }
          h1 { color: #064e3b; font-size: 26px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.02em; }
          p { color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 18px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <table class="main" role="presentation" cellspacing="0" cellpadding="0">
            <tr>
              <td class="header">
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align: middle;">
                      <img src="${logoUrl}" width="40" height="40" alt="Givar" style="border-radius: 10px; display: block; margin-right: 12px;">
                    </td>
                    <td style="vertical-align: middle;">
                      <span class="logo-text">Givar Impact</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="content">
                <h1>${title}</h1>
                ${content}
              </td>
            </tr>
            <tr>
              <td class="footer">
                <p style="font-size: 12px; font-weight: 700; color: #111827; margin-bottom: 4px;">Givar Impact</p>
                <p style="font-size: 12px; color: #6b7280; margin: 0;">Transparent Philanthropy Protocol</p>
                <p style="font-size: 11px; color: #9ca3af; margin-top: 16px;">&copy; ${new Date().getFullYear()} Givar Impact. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `,

  verification: (url: string, name: string) => `
    <p>Hi ${name},</p>
    <p>Welcome to <strong>Givar Impact</strong>. To ensure the security of your impact wallet and verify your identity on the ledger, please verify your email address.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${url}" class="button">Verify Email Address</a>
    </div>
    <p style="font-size: 13px; color: #6b7280;">This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
  `,

  receipt: (data: { amount: string; currency: string; project: string; date: string; ref: string }) => `
    <p>Your donation has been successfully verified and recorded on the <strong>Givar Impact</strong> public ledger.</p>
    <div class="stat-box">
      <div style="font-size: 11px; text-transform: uppercase; color: #059669; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">Amount</div>
      <div style="font-size: 32px; font-weight: 800; color: #064e3b;">${data.currency} ${data.amount}</div>
      <div style="height: 1px; background-color: #bbf7d0; margin: 16px 0;"></div>
      <div style="font-size: 11px; text-transform: uppercase; color: #059669; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">Beneficiary</div>
      <div style="font-size: 18px; font-weight: 700; color: #065f46;">${data.project}</div>
    </div>
    <p><strong>Reference:</strong> <code style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 6px; font-family: monospace;">${data.ref}</code></p>
    <p>Thank you for making a tangible difference today.</p>
  `,

  securityAlert: (data: { ip: string; time: string }) => `
    <p>We detected a new login to your <strong>Givar Impact</strong> account.</p>
    <div class="stat-box">
      <p style="margin: 0; font-size: 14px;"><strong>Time:</strong> ${data.time}</p>
      <p style="margin: 8px 0 0 0; font-size: 14px;"><strong>IP Address:</strong> ${data.ip}</p>
    </div>
    <p>If this was you, no action is needed. If not, please contact Givar Security immediately to lock your wallet.</p>
  `,

  subscriptionUpdate: (data: { name: string; project: string; status: string }) => `
    <p>Hi ${data.name},</p>
    <p>This is a notification regarding your recurring donation to <strong>${data.project}</strong>.</p>
    <div class="stat-box" style="text-align: center;">
      <div style="font-size: 11px; text-transform: uppercase; color: #059669; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">New Status</div>
      <div style="font-size: 28px; font-weight: 800; color: ${data.status === 'ACTIVE' ? '#10b981' : '#f59e0b'};">
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

  walletFunded: (data: { name: string; amount: string; currency: string; ref: string; newBalance: string }) => `
    <p>Hi ${data.name},</p>
    <p>Your <strong>Givar Impact</strong> wallet has been successfully topped up.</p>
    <div class="stat-box">
      <div style="font-size: 11px; text-transform: uppercase; color: #059669; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">Amount Added</div>
      <div style="font-size: 32px; font-weight: 800; color: #064e3b;">${data.currency} ${data.amount}</div>
      <div style="height: 1px; background-color: #bbf7d0; margin: 16px 0;"></div>
      <div style="font-size: 11px; text-transform: uppercase; color: #059669; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">New Ledger Balance</div>
      <div style="font-size: 20px; font-weight: 700; color: #065f46;">${data.currency} ${data.newBalance}</div>
    </div>
    <p><strong>Reference:</strong> <code style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 6px; font-family: monospace;">${data.ref}</code></p>
    <p>You can now use these funds to support any active cause on the platform.</p>
  `,

  passwordReset: (url: string, name: string) => `
    <p>Hi ${name},</p>
    <p>We received a request to reset your <strong>Givar Impact</strong> password. Click the button below to choose a new one.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${url}" class="button" style="background-color: #064e3b;">Reset Password</a>
    </div>
    <p style="font-size: 13px; color: #6b7280;">This link is valid for 1 hour. If you didn't request this, please secure your account immediately.</p>
  `,

  passwordChanged: (name: string, date: string) => `
    <p>Hi ${name},</p>
    <p>Your <strong>Givar Impact</strong> account password was successfully changed on <strong>${date}</strong>.</p>
    <p>For your security, we have logged you out of all other active sessions.</p>
    <p>If you did not make this change, please contact Givar Support immediately.</p>
  `,

  milestoneCompleted: (data: { donorName: string; projectTitle: string; milestonePhase: string; date: string; projectUrl: string; imageUrl?: string; }) => `
    <p>Hi ${data.donorName},</p>
    <p>Great news! A key milestone has been reached for the project you supported: <strong>${data.projectTitle}</strong>.</p>

    ${data.imageUrl ? `
      <div style="margin: 24px 0; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <img 
          src="${data.imageUrl}" 
          alt="Proof of Work" 
          style="width: 100%; max-width: 100%; height: auto; display: block; outline: none; border: none; text-decoration: none;"
        >
      </div>
    ` : ''}
    
    <div class="stat-box" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px;">
      <div style="font-size: 11px; text-transform: uppercase; color: #059669; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 8px;">Milestone Achieved</div>
      <div style="font-size: 22px; font-weight: 800; color: #064e3b; line-height: 1.2;">${data.milestonePhase}</div>
      <div style="height: 1px; background-color: #bbf7d0; margin: 16px 0;"></div>
      <div style="font-size: 13px; font-weight: 700; color: #059669;">
        Verified Complete on ${data.date}
      </div>
    </div>

    <p style="margin-top: 24px;">Because of your contribution, this project is one step closer to its final goal. View the full execution roadmap on Givar.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.projectUrl}" class="button" style="background-color: #10b981; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; display: inline-block;">
        View Project Progress
      </a>
    </div>
  `,

  evidenceRequest: (data: { name: string; project: string; milestone: string; vendor: string; uploadUrl: string }) => `
    <p>Hi ${data.name},</p>
    <p>Givar Management has officially disbursed funds to <strong>${data.vendor}</strong> for the following project phase:</p>
    
    <div class="stat-box">
      <div style="font-size: 11px; text-transform: uppercase; color: #059669; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">Active Milestone</div>
      <div style="font-size: 22px; font-weight: 800; color: #064e3b; line-height: 1.2;">${data.milestone}</div>
      <div style="height: 1px; background-color: #bbf7d0; margin: 16px 0;"></div>
      <div style="font-size: 13px; font-weight: 600; color: #065f46;">
        Project: ${data.project}
      </div>
    </div>

    <p>As the project owner, your verification is now required. Please capture and upload <strong>Proof of Progress</strong> (photos or documents) as soon as the work begins or materials arrive.</p>
    
    <p style="font-size: 14px; color: #6b7280; font-style: italic;">Note: Verification of this phase is a prerequisite for subsequent funding tranches.</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.uploadUrl}" class="button" style="background-color: #064e3b;">Upload Proof of Work</a>
    </div>
  `,
};