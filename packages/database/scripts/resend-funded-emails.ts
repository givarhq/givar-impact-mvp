import { resolve } from 'path';
import * as dotenv from 'dotenv';
import { prisma } from '../src/index';
import { Resend } from 'resend';

// Load environment variables from the API app where Resend keys are stored
dotenv.config({ path: resolve(__dirname, '../../../apps/api/.env') });
dotenv.config(); // Fallback to local

const TARGET_PROJECT_ID = process.argv[2] || '90eb087b-89ee-4f37-9197-bd529efd735d';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.givarapp.com';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL
    ? process.env.RESEND_FROM_EMAIL.replace('Givar', '"Givar"')
    : '"Givar" <onboarding@resend.dev>';

if (!RESEND_API_KEY) {
    console.error('❌ Missing RESEND_API_KEY in environment variables.');
    process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

// --- INLINED TEMPLATES FOR SCRIPT RELIABILITY ---

const baseTemplate = (content: string, title: string) => `
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
                  <img src="https://givarapp.com/Givar1.png" width="40" height="40" alt="Givar" style="border-radius: 10px; display: block; margin-right: 12px;">
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
`;

const projectFundedOrg = (data: { name: string; projectTitle: string; amount: string; currency: string; projectUrl: string }) => `
<p>Hi ${data.name},</p>
<p>Congratulations! Your cause <strong>${data.projectTitle}</strong> has reached its full funding goal.</p>
<div class="stat-box" style="text-align: center;">
  <div style="font-size: 11px; text-transform: uppercase; color: #059669; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">Total capital raised</div>
  <div style="font-size: 32px; font-weight: 800; color: #064e3b;">${data.currency} ${data.amount}</div>
</div>
<p>This is a major milestone. The system is now preparing to route the payment tranches based on your execution plan.</p>
<div style="text-align: center; margin: 32px 0;">
  <a href="${data.projectUrl}" class="button">Go to Management Console</a>
</div>
<p style="font-size: 14px; color: #6b7280;">Thank you for your commitment to impact. We look forward to seeing the execution results.</p>
`;

const projectFundedDonor = (data: { name: string; projectTitle: string; amount: string; currency: string; projectUrl: string }) => `
<p>Hi ${data.name},</p>
<p>Wonderful news! The cause you supported, <strong>${data.projectTitle}</strong>, has just reached its full funding goal.</p>
<div class="stat-box" style="text-align: center;">
  <div style="font-size: 11px; text-transform: uppercase; color: #059669; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px;">Cause goal reached</div>
  <div style="font-size: 32px; font-weight: 800; color: #064e3b;">${data.currency} ${data.amount}</div>
</div>
<p>Your contribution was essential in making this happen. We will keep you updated as the execution phases begin and milestones are achieved.</p>
<div style="text-align: center; margin: 32px 0;">
  <a href="${data.projectUrl}" class="button">View Cause Timeline</a>
</div>
<p style="font-size: 14px; color: #6b7280;">Thank you for your generosity and for being part of this impact journey.</p>
`;

// --- MAIN EXECUTION LOGIC ---

async function main() {
    console.log(`🚀 Initiating email resend protocol for project: ${TARGET_PROJECT_ID}`);

    const project = await prisma.project.findUnique({
        where: { id: TARGET_PROJECT_ID },
        include: { user: true }
    });

    if (!project) {
        console.error(`❌ Project ${TARGET_PROJECT_ID} not found on the ledger.`);
        process.exit(1);
    }

    // Fix: Using the correct project.targetAmount (Cause Goal) instead of individual donation amounts
    const targetAmountMajor = (Number(project.targetAmount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // 1. Fetch Unique Donors
    const userDonors = await prisma.donation.findMany({
        where: { projectId: project.id },
        select: { user: { select: { email: true, firstName: true, preferences: true } } },
        distinct: ['userId'],
    });

    const guestDonors = await prisma.guestDonation.findMany({
        where: { projectId: project.id },
        select: { guestDonor: { select: { email: true, name: true } } },
        distinct: ['guestDonorId'],
    });

    const recipients = [
        ...userDonors
            .filter(d => {
                const prefs = d.user?.preferences as any;
                return prefs?.milestoneUpdates !== false;
            })
            .map(d => ({ email: d.user!.email, name: d.user!.firstName })),
        ...guestDonors.map(d => ({ email: d.guestDonor.email, name: d.guestDonor.name || 'Giver' })),
    ].filter((v, i, a) => v.email && a.findIndex(t => t.email === v.email) === i);

    console.log(`📨 Found ${recipients.length} eligible donors to notify...`);

    // 2. Dispatch to Donors
    const donorPromises = recipients.map(r => {
        const content = projectFundedDonor({
            name: r.name,
            projectTitle: project.title,
            amount: targetAmountMajor,
            currency: project.currency,
            projectUrl: `${FRONTEND_URL}/explore/${project.slug}`
        });
        const html = baseTemplate(content, 'Cause Successfully Funded');

        return resend.emails.send({
            from: FROM_EMAIL,
            to: r.email,
            subject: 'Givar: The cause you supported is fully funded!',
            html
        });
    });

    const results = await Promise.allSettled(donorPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ Dispatched corrected emails to ${successCount}/${recipients.length} donors.`);

    // 3. Dispatch to Organizer
    if (project.user) {
        const orgContent = projectFundedOrg({
            name: project.user.firstName,
            projectTitle: project.title,
            amount: targetAmountMajor,
            currency: project.currency,
            projectUrl: `${FRONTEND_URL}/dashboard/projects/${project.id}/manage`
        });
        const orgHtml = baseTemplate(orgContent, 'Cause Fully Funded');

        await resend.emails.send({
            from: FROM_EMAIL,
            to: project.user.email,
            subject: `Givar: Success! ${project.title} is fully funded`,
            html: orgHtml
        });
        console.log(`✅ Dispatched corrected email to organizer: ${project.user.email}`);
    }

    console.log('🎉 Email resend protocol completed successfully.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());