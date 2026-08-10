export const EmailTemplates = {
  base: (content: string, title: string, logoUrl = 'https://givarapp.com/Givar1.png') => `
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
          .breakdown-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; }
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
                      <span class="logo-text">Givar</span>
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
                <p style="font-size: 12px; font-weight: 700; color: #111827; margin-bottom: 4px;">Givar</p>
                <p style="font-size: 11px; color: #9ca3af; margin-top: 8px;">&copy; ${new Date().getFullYear()} Givar. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `,

  verification: (url: string, name: string, code?: string) => `
    <p>Hi ${name},</p>
    <p>Welcome to <strong>Givar</strong>. To ensure the security of your account and verify your identity on the public ledger, please verify your email address.</p>
    
    ${code ? `
    <div style="text-align: center; margin: 32px 0;">
      <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #6b7280; margin-bottom: 8px; font-weight: 700;">Verification Code</p>
      <div style="font-size: 32px; font-family: monospace; font-weight: 700; letter-spacing: 8px; color: #111827; background: #f3f4f6; padding: 16px; border-radius: 12px; display: inline-block;">
        ${code}
      </div>
    </div>
    ` : ''}

    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${url}" class="button">Verify Email Address</a>
    </div>
    <p style="font-size: 13px; color: #6b7280;">This link/code will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
  `,

  receipt: (data: {
    amount: string;
    currency: string;
    project: string;
    date: string;
    ref: string;
    donorAmount?: string;
    donorCurrency?: string;
    phaseName?: string;
  }) => `
    <p>Your donation has been successfully verified and recorded on the <strong>Givar</strong> public ledger.</p>
    
    <div class="stat-box">
      <div style="font-size: 11px; text-transform: uppercase; color: #059669; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">Total Contribution</div>
      <div style="font-size: 32px; font-weight: 800; color: #064e3b;">${data.currency} ${data.amount}</div>
      
      ${data.donorCurrency && data.donorCurrency !== data.currency ? `
        <div style="font-size: 13px; font-weight: 700; color: #059669; margin-top: 4px; opacity: 0.8;">
          (Estimated value: ${data.donorCurrency === 'CAD' ? 'C$' : data.donorCurrency === 'USD' ? '$' : data.donorCurrency === 'GBP' ? '£' : data.donorCurrency === 'EUR' ? '€' : data.donorCurrency} ${Number(data.donorAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
        </div>
      ` : ''}
      
      <div style="height: 1px; background-color: #bbf7d0; margin: 16px 0;"></div>
      <div style="font-size: 11px; text-transform: uppercase; color: #059669; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">Cause</div>
      <div style="font-size: 16px; font-weight: 700; color: #065f46; line-height: 1.4;">
          ${data.project}
          ${data.phaseName ? `<br/><span style="font-size: 13px; color: #059669; font-weight: 600;">${data.phaseName}</span>` : ''}
      </div>
    </div>
    
    <p><strong>Reference:</strong> <code style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 6px; font-family: monospace;">${data.ref}</code></p>
    <p>Thank you for giving with confidence. 💚</p>
  `,

  securityAlert: (data: { ip: string; time: string }) => `
    <p>We detected a new login to your <strong>Givar</strong> account.</p>
    <div class="stat-box">
      <p style="margin: 0; font-size: 14px;"><strong>Time:</strong> ${data.time}</p>
      <p style="margin: 8px 0 0 0; font-size: 14px;"><strong>IP Address:</strong> ${data.ip}</p>
    </div>
    <p>If this was you, no action is needed. If not, please contact Givar Security immediately to lock your account.</p>
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

  walletFunded: (data: { name: string; amount: string; currency: string; ref: string; newBalance: string; donorAmount?: string; donorCurrency?: string; }) => `
    <p>Hi ${data.name},</p>
    <p>Your <strong>Givar</strong> account has received a direct deposit.</p>
    <div class="stat-box">
      <div style="font-size: 11px; text-transform: uppercase; color: #059669; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">Amount Received</div>
      <div style="font-size: 32px; font-weight: 800; color: #064e3b;">${data.currency} ${data.amount}</div>
      
      ${data.donorCurrency && data.donorCurrency !== data.currency ? `
        <div style="font-size: 13px; font-weight: 700; color: #059669; margin-top: 4px; opacity: 0.8;">
          (Estimated value: ${data.donorCurrency === 'CAD' ? 'C$' : data.donorCurrency === 'USD' ? '$' : data.donorCurrency === 'GBP' ? '£' : data.donorCurrency === 'EUR' ? '€' : data.donorCurrency} ${Number(data.donorAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
        </div>
      ` : ''}
    </div>
    <p><strong>Reference:</strong> <code style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 6px; font-family: monospace;">${data.ref}</code></p>
  `,

  passwordReset: (url: string, name: string) => `
    <p>Hi ${name},</p>
    <p>We received a request to reset your <strong>Givar</strong> password. Click the button below to choose a new one.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${url}" class="button" style="background-color: #064e3b;">Reset Password</a>
    </div>
    <p style="font-size: 13px; color: #6b7280;">This link is valid for 1 hour. If you didn't request this, please secure your account immediately.</p>
  `,

  passwordChanged: (name: string, date: string) => `
    <p>Hi ${name},</p>
    <p>Your <strong>Givar</strong> account password was successfully changed on <strong>${date}</strong>.</p>
    <p>For your security, we have logged you out of all other active sessions.</p>
    <p>If you did not make this change, please contact Givar Support immediately.</p>
  `,

  milestoneCompleted: (data: { donorName: string; projectTitle: string; milestonePhase: string; date: string; projectUrl: string; imageUrl?: string; }) => `
    <p>Hi ${data.donorName},</p>
    <p>Great news! A key milestone has been reached for the cause you supported: <strong>${data.projectTitle}</strong>.</p>

    ${data.imageUrl ? `
      <div style="margin: 20px 0; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <img src="${data.imageUrl}" alt="Proof of Work" style="width: 100%; height: auto; display: block;">
      </div>
    ` : ''}
    
    <div class="stat-box">
      <div style="font-size: 11px; text-transform: uppercase; color: #059669; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">Milestone Achieved</div>
      <div style="font-size: 24px; font-weight: 800; color: #064e3b; line-height: 1.2;">${data.milestonePhase}</div>
      <div style="height: 1px; background-color: #bbf7d0; margin: 16px 0;"></div>
      <div style="font-size: 13px; font-weight: 700; color: #059669; display: flex; align-items: center;">
        <span style="margin-right: 6px;">✓</span> Verified Complete on ${data.date}
      </div>
    </div>

    <p>Because of your contribution, this cause is one step closer to its final goal. You can view the updated timeline and impact details on the cause page.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.projectUrl}" class="button">View Cause Progress</a>
    </div>

    <p style="font-size: 14px; color: #6b7280;">Thank you for being a vital part of this journey.</p>
  `,

  evidenceRequest: (data: { name: string; project: string; milestone: string; vendor: string; uploadUrl: string }) => `
    <p>Hi ${data.name},</p>
    <p>Givar Management has officially disbursed funds to <strong>${data.vendor}</strong> for the following stage:</p>
    
    <div class="stat-box">
      <div style="font-size: 11px; text-transform: uppercase; color: #059669; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">Active Funding Stage</div>
      <div style="font-size: 22px; font-weight: 800; color: #064e3b; line-height: 1.2;">${data.milestone}</div>
      <div style="height: 1px; background-color: #bbf7d0; margin: 16px 0;"></div>
      <div style="font-size: 13px; font-weight: 600; color: #065f46;">
        Cause: ${data.project}
      </div>
    </div>

    <p>As the cause organizer, your verification is now required. Please capture and upload <strong>Proof of Progress</strong> (photos or documents) as soon as the work begins or materials arrive.</p>
    
    <p style="font-size: 14px; color: #6b7280; font-style: italic;">Note: Verification of this stage is a prerequisite for subsequent funding tranches.</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.uploadUrl}" class="button" style="background-color: #064e3b;">Upload Proof of Work</a>
    </div>
  `,

  proposalStatusUpdate: (data: { name: string; project: string; status: string; feedback?: string; url: string }) => {
    if (data.status === 'APPROVED') {
      return `
            <p>Hi ${data.name},</p>
            <p>Great news — your cause, "<strong>${data.project}</strong>", has been approved and is now ready to go live.</p>
            <p>You can view and manage your cause below.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${data.url}" class="button">View Cause</a>
            </div>
        `;
    } else if (data.status === 'CHANGES REQUESTED') {
      return `
            <p>Hi ${data.name},</p>
            <p>There’s an update on your cause, "<strong>${data.project}</strong>".</p>
            <div class="stat-box" style="text-align: center;">
              <div style="font-size: 11px; text-transform: uppercase; color: #b45309; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">Status</div>
              <div style="font-size: 24px; font-weight: 800; color: #92400e;">Changes Requested</div>
            </div>
            <p>Our team has reviewed your submission and needs a bit more information to proceed.</p>
            ${data.feedback ? `<p><strong>Admin Feedback:</strong><br/>${data.feedback}</p>` : ''}
            <p>You can review the feedback and update your cause from the Drafts section in My Causes.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${data.url}" class="button">View Cause</a>
            </div>
        `;
    } else {
      return `
            <p>Hi ${data.name},</p>
            <p>The status of your cause "<strong>${data.project}</strong>" has been updated.</p>
            <div class="stat-box" style="text-align: center;">
              <div style="font-size: 11px; text-transform: uppercase; color: #059669; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">New Status</div>
              <div style="font-size: 24px; font-weight: 800; color: #064e3b;">${data.status}</div>
            </div>
            ${data.feedback ? `<p><strong>Feedback:</strong> ${data.feedback}</p>` : ''}
            <div style="text-align: center; margin: 32px 0;">
              <a href="${data.url}" class="button">Track Cause Status</a>
            </div>
        `;
    }
  },

  milestoneOwnerUpdate: (data: { name: string; project: string; milestone: string; status: string; url: string }) => `
    <p>Hi ${data.name},</p>
    <p>The execution status for a stage in <strong>${data.project}</strong> has changed.</p>
    <div class="stat-box">
        <p style="margin:0; font-size: 14px;"><strong>Funding Stage:</strong> ${data.milestone}</p>
        <p style="margin:8px 0 0 0; font-size: 14px;"><strong>New Status:</strong> <span style="color: #10b981; font-weight: 700;">${data.status}</span></p>
    </div>
    <p>Please log in to your management console to view next steps or upload required evidence.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.url}" class="button">Manage Cause</a>
    </div>
  `,

  financialAdjustment: (data: {
    name: string;
    projectTitle: string;
    oldGoal: string;
    newGoal: string;
    currency: string;
    reason: string;
    projectUrl: string;
  }) => {
    const isGoalChange = data.oldGoal !== data.newGoal;

    return `
    <p>Hi ${data.name},</p>
    <p>This is an automated transparency notice regarding the cause <strong>${data.projectTitle}</strong>.</p>
    
    <div class="stat-box" style="background-color: #fffbeb; border: 1px solid #fde68a;">
      <div style="font-size: 11px; text-transform: uppercase; color: #b45309; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 8px;">${isGoalChange ? 'Ledger Amendment Detail' : 'Execution Plan Update'}</div>
      
      ${isGoalChange ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding-bottom: 12px;">
            <span style="font-size: 12px; color: #92400e;">Previous Goal:</span><br>
            <span style="font-size: 18px; font-weight: 700; color: #78350f; text-decoration: line-through;">${data.currency} ${data.oldGoal}</span>
          </td>
        </tr>
        <tr>
          <td>
            <span style="font-size: 12px; color: #92400e;">Updated Goal:</span><br>
            <span style="font-size: 24px; font-weight: 800; color: #b45309;">${data.currency} ${data.newGoal}</span>
          </td>
        </tr>
      </table>
      ` : `
      <p style="font-size: 14px; color: #92400e; margin: 0; font-weight: 500; line-height: 1.5;">
        The internal budget breakdown or execution roadmap for this cause has been updated by the organizer. The overall financial goal remains unchanged at <strong>${data.currency} ${data.newGoal}</strong>.
      </p>
      `}

      <div style="height: 1px; background-color: #fde68a; margin: 16px 0;"></div>
      
      <div style="font-size: 11px; text-transform: uppercase; color: #b45309; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">Reason for Adjustment</div>
      <p style="font-size: 14px; color: #92400e; margin: 0; font-style: italic; line-height: 1.5;">"${data.reason}"</p>
    </div>

    <p>Givar requires all live financial or structural changes to be verified by audit nodes and broadcasted to the community to maintain the integrity of our immutable ledger.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.projectUrl}" class="button" style="background-color: #b45309;">View Cause Updates</a>
    </div>

    <p style="font-size: 13px; color: #6b7280;">If you have any questions regarding this amendment, please contact the Givar Audit Team.</p>
  `
  },

  projectFunded: (data: { name: string; projectTitle: string; amount: string; currency: string; projectUrl: string }) => `
    <p>Hi ${data.name},</p>
    <p>Congratulations! Your cause <strong>${data.projectTitle}</strong> has reached its full funding goal.</p>
    <div class="stat-box" style="text-align: center;">
      <div style="font-size: 11px; text-transform: uppercase; color: #059669; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">Total Capital Raised</div>
      <div style="font-size: 32px; font-weight: 800; color: #064e3b;">${data.currency} ${data.amount}</div>
    </div>
    <p>This is a major milestone. The system is now preparing to route the payment tranches based on your execution plan.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.projectUrl}" class="button">Go to Management Console</a>
    </div>
    <p style="font-size: 14px; color: #6b7280;">Thank you for your commitment to impact. We look forward to seeing the execution results.</p>
  `,

  projectFundedDonor: (data: { name: string; projectTitle: string; amount: string; currency: string; projectUrl: string }) => `
    <p>Hi ${data.name},</p>
    <p>Wonderful news! The cause you supported, <strong>${data.projectTitle}</strong>, has just reached its full funding goal.</p>
    <div class="stat-box" style="text-align: center;">
      <div style="font-size: 11px; text-transform: uppercase; color: #059669; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">Cause Goal Reached</div>
      <div style="font-size: 32px; font-weight: 800; color: #064e3b;">${data.currency} ${data.amount}</div>
    </div>
    <p>Your contribution was essential in making this happen. We'll share an update with you once the outcome is confirmed.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.projectUrl}" class="button">View cause details</a>
    </div>
    <p style="font-size: 14px; color: #6b7280;">Thank you for your generosity and for being part of this impact journey.</p>
  `,

  impactAchievedDonor: (data: { name: string; projectTitle: string; projectUrl: string; mediaThumbnail?: string; disbursementSummary?: string }) => `
    <p>Hi ${data.name},</p>
    <p>We are thrilled to announce that the impact you supported has been fully realized!</p>
    
    <div class="stat-box" style="text-align: center; background-color: #f0fdf4; border-color: #bbf7d0;">
      <div style="font-size: 11px; text-transform: uppercase; color: #059669; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">Impact Achieved</div>
      <div style="font-size: 24px; font-weight: 800; color: #064e3b; line-height: 1.3;">${data.projectTitle}</div>
    </div>

    ${data.mediaThumbnail ? `
      <div style="margin: 24px 0; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <img src="${data.mediaThumbnail}" alt="Impact Evidence" style="width: 100%; max-height: 300px; object-fit: cover; display: block;" />
      </div>
    ` : ''}

    <p>Thank you for making this possible. All cause milestones are now verified and finalized on the Givar immutable ledger.</p>

    ${data.disbursementSummary ? `
      <div style="margin: 24px 0; padding: 20px; border-radius: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-size: 13px; color: #475569;">
        <strong style="color: #0f172a; font-size: 14px;">Funds Disbursement Summary:</strong><br/>
        <div style="margin-top: 8px;">${data.disbursementSummary}</div>
      </div>
    ` : ''}

    <div style="text-align: center; margin: 36px 0;">
      <a href="${data.projectUrl}" class="button" style="background-color: #10b981;">View Final Impact Report</a>
    </div>

    <p style="font-size: 14px; color: #6b7280;">Your generosity changes lives. We look forward to building a transparent future with you.</p>
  `,

  feedbackReceived: (data: {
    userName: string;
    projectTitle: string;
    messageContent: string;
    actionUrl: string;
  }) => `
    <p>Hi ${data.userName},</p>
    <p>You have a new message from the Givar team regarding <strong>${data.projectTitle}</strong>.</p>
    
    <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 16px; padding: 24px; margin: 24px 0;">
      <p style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 8px; font-weight: 700;">Message content</p>
      <p style="font-size: 15px; color: #111827; line-height: 1.6; margin: 0; font-style: italic;">
        "${data.messageContent}"
      </p>
    </div>

    <p>We recommend reviewing this feedback soon to keep your cause moving forward. You can reply directly through your dashboard.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.actionUrl}" class="button">View conversation</a>
    </div>

    <p style="font-size: 13px; color: #6b7280;">If you have any questions, simply reply to this email to reach our support team.</p>
  `,

  adminEvidenceSubmitted: (data: {
    adminName: string;
    projectTitle: string;
    milestonePhase: string;
    queueUrl: string;
  }) => `
    <p>Hi ${data.adminName},</p>
    <p>A new proof of work has been submitted for <strong>${data.projectTitle}</strong> and requires your review.</p>
    
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 24px; margin: 24px 0;">
      <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #059669; margin-bottom: 8px; font-weight: 700;">Cause Stage</p>
      <p style="font-size: 18px; color: #064e3b; font-weight: 800; margin: 0;">${data.milestonePhase}</p>
    </div>

    <p>Please audit the uploaded photos and description to ensure they meet the cause requirements. Once verified, the next funding tranche will be eligible for disbursement.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.queueUrl}" class="button">Open evidence queue</a>
    </div>

    <p style="font-size: 13px; color: #6b7280;">This is an automated administrative alert from the Givar compliance system.</p>
  `,

  adminProposalSubmitted: (data: { adminName: string; projectTitle: string; proposerName: string; url: string }) => `
    <p>Hi ${data.adminName},</p>
    <p>A new cause, <strong>"${data.projectTitle}"</strong>, has been submitted by <strong>${data.proposerName}</strong> and is awaiting technical vetting.</p>
    
    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 16px; padding: 24px; margin: 24px 0;">
      <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #0369a1; margin-bottom: 8px; font-weight: 700;">Action Required</p>
      <p style="font-size: 15px; color: #0c4a6e; line-height: 1.6; margin: 0; font-weight: 600;">
        Review the budget ledger, execution roadmap, and risk assessment to authorize this cause for the public feed.
      </p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.url}" class="button" style="background-color: #0369a1;">Review Cause</a>
    </div>
    <p style="font-size: 13px; color: #6b7280;">This is an automated administrative alert from the Givar Compliance Node.</p>
  `,

  adminKycSubmitted: (data: { adminName: string; orgName: string; proposerName: string; kycType: string; url: string }) => `
    <p>Hi ${data.adminName},</p>
    <p><strong>${data.proposerName}</strong> has submitted legal documentation for the ${data.kycType === 'INDIVIDUAL' ? 'individual identity' : 'corporate entity'}: <strong>"${data.orgName}"</strong>.</p>
    
    <div class="stat-box" style="background-color: #faf5ff; border: 1px solid #e9d5ff;">
      <div style="font-size: 11px; text-transform: uppercase; color: #7e22ce; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">Compliance Check</div>
      <p style="font-size: 14px; color: #581c87; margin: 0; font-weight: 600;">${data.kycType === 'INDIVIDUAL' ? 'Verify government identification and liveness check to grant Individual status.' : 'Verify incorporation documents and registration IDs to grant Corporate status.'}</p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.url}" class="button" style="background-color: #7e22ce;">Open Verification Queue</a>
    </div>
  `,

  adminNewMessage: (data: { adminName: string; senderName: string; projectTitle: string; content: string; url: string; isAmendment?: boolean }) => `
    <p>Hi ${data.adminName},</p>
    <p>${data.isAmendment
      ? `A new funding amendment has been requested by <strong>${data.senderName}</strong> for the cause: <strong>"${data.projectTitle}"</strong>.`
      : `You have a new message from <strong>${data.senderName}</strong> regarding the cause: <strong>"${data.projectTitle}"</strong>.`
    }</p>

    <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 16px; padding: 24px; margin: 24px 0;">
      <p style="font-size: 13px; color: #111827; line-height: 1.6; margin: 0; font-style: italic;">
        "${data.content}"
      </p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.url}" class="button" style="background-color: #111827;">${data.isAmendment ? 'Review Amendment' : 'Reply to Owner'}</a>
    </div>
  `,

  adminHighCapitalIntent: (data: { adminName: string; userEmail: string; amount: string; currency: string }) => `
    <p>Hi ${data.adminName},</p>
    <p><strong>Institutional Intent Detected:</strong> A user has attempted a high-value direct payment that exceeds the standard threshold.</p>
    
    <div class="stat-box" style="background-color: #f0f9ff; border: 1px solid #bae6fd;">
      <div style="font-size: 11px; text-transform: uppercase; color: #0369a1; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">Attempted Amount</div>
      <div style="font-size: 28px; font-weight: 800; color: #075985;">${data.currency} ${data.amount}</div>
      <div style="height: 1px; background-color: #e0f2fe; margin: 16px 0;"></div>
      <p style="margin: 0; font-size: 13px; color: #075985;"><strong>Potential Lead:</strong> ${data.userEmail}</p>
    </div>

    <p>The transaction was automatically blocked by the ledger safety nodes. This represents a significant opportunity for institutional onboarding and manual verification.</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="mailto:${data.userEmail}" class="button" style="background-color: #0369a1;">Contact Potential Donor</a>
    </div>
  `,

  proposalSubmitted: (data: { name: string; projectTitle: string; url: string }) => `
    <p>Hi ${data.name},</p>
    <p>Your cause, <strong>"${data.projectTitle}"</strong>, has been successfully submitted for review.</p>
    
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 24px; margin: 24px 0;">
      <p style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #059669; margin-bottom: 8px; font-weight: 700;">Status: Under Review</p>
      <p style="font-size: 15px; color: #064e3b; line-height: 1.6; margin: 0; font-weight: 600;">
        Our team is reviewing your submission to ensure everything is clear, accurate, and ready to go live. We'll notify you once the review is complete.
      </p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.url}" class="button">Track Cause Status</a>
    </div>
    <p style="font-size: 13px; color: #6b7280;">You can reply to this email if you have any questions regarding the review timeline.</p>
  `,

  kycSubmitted: (data: { name: string; kycType: string; url: string }) => `
  <p>Hi ${data.name},</p>
  <p>Your identity documents have been submitted successfully and are now being reviewed.</p>
  
  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 24px; margin: 24px 0;">
    <p style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #059669; margin-bottom: 8px; font-weight: 700;">Status: Under Review</p>
    <p style="font-size: 15px; color: #064e3b; line-height: 1.6; margin: 0; font-weight: 600;">
      Our team is checking your ${data.kycType === 'INDIVIDUAL' ? 'personal ID' : 'business registration'} documents. This usually takes 24 to 48 hours.
    </p>
  </div>

  <div style="text-align: center; margin: 32px 0;">
    <a href="${data.url}" class="button">Track Status</a>
  </div>
`,

  kycApproved: (data: { name: string; kycType: string; url: string }) => `
  <p>Hi ${data.name},</p>
  <p>Good news! Your <strong>${data.kycType === 'INDIVIDUAL' ? 'identity' : 'corporate entity'}</strong> has been verified by the Givar team.</p>
  
  <div class="stat-box" style="text-align: center;">
    <div style="font-size: 11px; text-transform: uppercase; color: #059669; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">Verification Status</div>
    <div style="font-size: 24px; font-weight: 800; color: #064e3b;">Approved</div>
  </div>
  
  <p>You can now create public causes and receive donations on the platform.</p>
  
  <div style="text-align: center; margin: 32px 0;">
    <a href="${data.url}" class="button">Go to Dashboard</a>
  </div>
`,

  kycRejected: (data: { name: string; feedback: string; url: string }) => `
  <p>Hi ${data.name},</p>
  <p>There was a problem reviewing your identity documents.</p>
  
  <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 16px; padding: 24px; margin: 24px 0;">
    <p style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #e11d48; margin-bottom: 8px; font-weight: 700;">Action Required</p>
    <p style="font-size: 15px; color: #881337; line-height: 1.6; margin: 0; font-weight: 600;">
      ${data.feedback}
    </p>
  </div>

  <p>Please log in to your account to see the feedback and upload the correct documents so we can complete your verification.</p>
  
  <div style="text-align: center; margin: 32px 0;">
    <a href="${data.url}" class="button" style="background-color: #e11d48;">Review & Update</a>
  </div>
`,

  sendPhaseUnlockedAlert: (data: { projectTitle: string; projectUrl: string }) => `
      <p>Hi there,</p>
      <p>Incredible news! The previous stage of <strong>${data.projectTitle}</strong> has been fully executed, and the proof of work has been audited and verified by our team.</p>
      
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 32px 24px; margin: 24px 0; text-align: center;">
        <p style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #059669; margin-bottom: 8px; font-weight: 700;">Milestone Achieved</p>
        <p style="font-size: 24px; color: #064e3b; font-weight: 800; margin: 0; line-height: 1.2;">The next funding stage is now OPEN!</p>
      </div>

      <p>Because you asked to be notified, you're the first to know. The cause still needs your support to reach the finish line. Let's keep the momentum going!</p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${data.projectUrl}" class="button" style="background-color: #10b981; padding: 18px 40px; font-size: 16px;">Fund the next stage</a>
      </div>
      
      <p style="font-size: 13px; color: #6b7280;">Thank you for your commitment to transparent, milestone-driven impact.</p>
  `,

  adminVendorPayoutConfirmed: (data: { adminName: string; projectTitle: string; phaseName: string; vendorName: string; amount: string; currency: string; reference: string; url: string }) => `
    <p>Hi ${data.adminName},</p>
    <p><strong>Stage funding accomplished:</strong> The full capital required for a cause stage has been successfully secured and routed to the verified vendor subaccount.</p>
    <div class="stat-box" style="border-color: #10b981; background-color: #f0fdf4;">
      <div style="font-size: 11px; color: #059669; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">Total stage capital secured</div>
      <div style="font-size: 32px; font-weight: 800; color: #10b981;">${data.currency} ${data.amount}</div>
      <div style="height: 1px; background-color: #bbf7d0; margin: 16px 0;"></div>
      <p style="margin: 0; font-size: 14px; color: #064e3b;"><strong>Cause:</strong> ${data.projectTitle}</p>
      <p style="margin: 4px 0; font-size: 14px; color: #064e3b;"><strong>Funding Stage:</strong> ${data.phaseName}</p>
      <p style="margin: 4px 0; font-size: 14px; color: #064e3b;"><strong>Vendor:</strong> ${data.vendorName}</p>
      <p style="margin: 12px 0 0 0; font-size: 10px; color: #059669; font-family: monospace; opacity: 0.7;">Finalizing reference: ${data.reference}</p>
    </div>
    <p>Execution can now begin. Please contact the vendor immediately to authorize the start of work for this stage.</p>
  `,

  vendorPhaseFunded: (data: { vendorName: string; projectTitle: string; phaseName: string; amount: string; currency: string; reference: string }) => `
    <p>Hi ${data.vendorName},</p>
    <p>This is an automated notification from <strong>Givar</strong>.</p>
    <p>We are pleased to inform you that the required capital for your services regarding the cause <strong>"${data.projectTitle}"</strong> has been successfully secured by donors.</p>
    
    <div class="stat-box" style="border-color: #10b981; background-color: #f0fdf4;">
      <div style="font-size: 11px; color: #059669; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px; text-transform: uppercase;">Stage Fully Funded</div>
      <div style="font-size: 24px; font-weight: 800; color: #10b981;">${data.currency} ${data.amount}</div>
      <p style="margin: 12px 0 0 0; font-size: 14px; color: #064e3b;"><strong>Funding Stage:</strong> ${data.phaseName}</p>
      <p style="margin: 4px 0 0 0; font-size: 14px; color: #064e3b;"><strong>Reference:</strong> ${data.reference}</p>
    </div>

    <p><strong>Important settlement notice:</strong><br/>
    These funds have been routed to your authorized Paystack subaccount. <strong>Please note that Paystack settles funds to your registered bank account on a T+1 basis (the next working day).</strong></p>
    
    <p>Once the funds reflect in your bank account, please commence execution and provide the cause organizer with the necessary receipts and photographic proof of work.</p>
  `,

  amendmentStatusAlert: (data: { name: string; projectTitle: string; status: string; feedback?: string; projectUrl: string }) => `
    <p>Hi ${data.name},</p>
    <p>Your funding amendment request for <strong>${data.projectTitle}</strong> has been reviewed.</p>
    
    <div class="stat-box" style="text-align: center; background-color: ${data.status === 'APPROVED' ? '#f0fdf4' : '#fff1f2'}; border-color: ${data.status === 'APPROVED' ? '#bbf7d0' : '#fecdd3'};">
      <div style="font-size: 11px; text-transform: uppercase; color: ${data.status === 'APPROVED' ? '#059669' : '#e11d48'}; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">Status</div>
      <div style="font-size: 24px; font-weight: 800; color: ${data.status === 'APPROVED' ? '#064e3b' : '#881337'};">${data.status === 'APPROVED' ? 'Approved' : 'Declined'}</div>
    </div>

    ${data.feedback ? `
    <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 16px; padding: 20px; margin: 24px 0;">
      <p style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 8px; font-weight: 700;">Admin feedback</p>
      <p style="font-size: 14px; color: #111827; line-height: 1.6; margin: 0; font-style: italic;">
        "${data.feedback}"
      </p>
    </div>
    ` : ''}

    <p>${data.status === 'APPROVED' ? 'Your project ledger has been securely updated with the new budget requirements.' : 'Please review the feedback and submit a new request if necessary.'}</p>

    <div style="text-align: center; margin: 36px 0;">
      <a href="${data.projectUrl}" class="button" style="background-color: ${data.status === 'APPROVED' ? '#10b981' : '#111827'};">Go to management console</a>
    </div>
  `,

  adminProjectReportedAlert: (data: { adminName: string; projectTitle: string; reason: string; url: string; isHighRisk?: boolean }) => `
    <p>Hi ${data.adminName},</p>
    <p>A ${data.isHighRisk ? 'critical' : 'new'} community report has been submitted regarding the cause: <strong>"${data.projectTitle}"</strong>.</p>
    
    <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 16px; padding: 24px; margin: 24px 0;">
      <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #e11d48; margin-bottom: 8px; font-weight: 700;">Report reason</p>
      <p style="font-size: 15px; color: #881337; line-height: 1.6; margin: 0; font-weight: 600;">
        "${data.reason}"
      </p>
    </div>

    <p><strong>This cause has NOT been automatically suspended.</strong> Please review the report ${data.isHighRisk ? 'immediately ' : ''}and determine if a manual suspension is required to halt incoming donations.</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.url}" class="button" style="background-color: #e11d48;">Review report</a>
    </div>
  `,

  reportReceivedReporter: (data: { projectName: string }) => `
    <p>Hi there,</p>
    <p>Thank you for submitting a report regarding the cause: <strong>"${data.projectName}"</strong>.</p>
    
    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 16px; padding: 24px; margin: 24px 0;">
      <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #0369a1; margin-bottom: 8px; font-weight: 700;">Report Received</p>
      <p style="font-size: 14px; color: #0c4a6e; line-height: 1.6; margin: 0; font-weight: 500;">
        Our Trust & Safety team is currently investigating your submission. We take platform integrity very seriously and will take the necessary administrative actions based on our findings.
      </p>
    </div>

    <p style="font-size: 13px; color: #6b7280;">If we require further information, we will reach out to this email address.</p>
  `,

  reportReceivedOrganizer: (data: { name: string; projectName: string; reason: string; url: string }) => `
    <p>Hi ${data.name},</p>
    <p>An urgent community report has been filed against your cause: <strong>"${data.projectName}"</strong>.</p>
    
    <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 16px; padding: 24px; margin: 24px 0;">
      <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #e11d48; margin-bottom: 8px; font-weight: 700;">Cause Temporarily Suspended</p>
      <p style="font-size: 14px; color: #881337; line-height: 1.6; margin: 0; font-weight: 600;">
        Report Reason: "${data.reason}"
      </p>
    </div>

    <p>To protect the integrity of the platform, donations to this cause have been temporarily paused while our administrative team investigates.</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.url}" class="button" style="background-color: #e11d48;">View Console</a>
    </div>

    <p style="font-size: 13px; color: #6b7280;">Our compliance team will contact you shortly if further information is required.</p>
  `,

  reportResolvedReporter: (data: { projectName: string; actionTaken: string }) => `
    <p>Hi there,</p>
    <p>We have concluded our investigation into your report regarding the cause: <strong>"${data.projectName}"</strong>.</p>
    
    <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 16px; padding: 24px; margin: 24px 0;">
      <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #374151; margin-bottom: 8px; font-weight: 700;">Resolution Outcome</p>
      <p style="font-size: 14px; color: #111827; line-height: 1.6; margin: 0; font-weight: 500;">
        ${data.actionTaken}
      </p>
    </div>

    <p style="font-size: 13px; color: #6b7280;">Thank you for helping us maintain a safe and transparent environment for everyone.</p>
  `,

  reportResolvedOrganizer: (data: { name: string; projectName: string; status: string; feedback: string; url: string }) => `
    <p>Hi ${data.name},</p>
    <p>We have concluded the administrative review of the dispute filed against your cause: <strong>"${data.projectName}"</strong>.</p>
    
    <div style="background-color: ${data.status === 'REINSTATED' ? '#f0fdf4' : '#fff1f2'}; border: 1px solid ${data.status === 'REINSTATED' ? '#bbf7d0' : '#fecdd3'}; border-radius: 16px; padding: 24px; margin: 24px 0;">
      <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: ${data.status === 'REINSTATED' ? '#059669' : '#e11d48'}; margin-bottom: 8px; font-weight: 700;">
        Review Decision: ${data.status}
      </p>
      <p style="font-size: 14px; color: ${data.status === 'REINSTATED' ? '#064e3b' : '#881337'}; line-height: 1.6; margin: 0; font-weight: 600;">
        "${data.feedback}"
      </p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.url}" class="button" style="background-color: ${data.status === 'REINSTATED' ? '#10b981' : '#111827'};">Go to Console</a>
    </div>
  `,

  legalDocumentUpdated: (data: { name: string; documentTitle: string; url: string }) => `
    <p>Hi ${data.name},</p>
    <p>We are writing to let you know that we have updated our <strong>${data.documentTitle}</strong>.</p>
    
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 24px; margin: 24px 0;">
      <p style="font-size: 15px; color: #064e3b; line-height: 1.6; margin: 0; font-weight: 500;">
        These changes help us maintain our commitment to transparency, security, and compliance on the Givar platform. We encourage you to review the updated document.
      </p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.url}" class="button" style="background-color: #10b981;">Review Policy</a>
    </div>

    <p style="font-size: 13px; color: #6b7280;">Thank you for being part of the Givar community.</p>
  `,

  adminProposalRecommended: (data: { adminName: string; projectTitle: string; recommendingAdminName: string; internalNotes: string; url: string }) => `
    <p>Hi ${data.adminName},</p>
    <p>A new cause, <strong>"${data.projectTitle}"</strong>, has been reviewed and recommended for approval by <strong>${data.recommendingAdminName}</strong>.</p>
    
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 24px; margin: 24px 0;">
      <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #059669; margin-bottom: 8px; font-weight: 700;">Admin Internal Notes</p>
      <p style="font-size: 15px; color: #064e3b; line-height: 1.6; margin: 0; font-style: italic;">
        "${data.internalNotes}"
      </p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.url}" class="button" style="background-color: #064e3b;">Review & Launch Cause</a>
    </div>
    <p style="font-size: 13px; color: #6b7280;">This is an automated administrative alert from the Givar Compliance Node.</p>
  `,
};