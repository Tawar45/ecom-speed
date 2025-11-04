import {cancellationEmailTemplate } from "../utils/cancel_subscription_template";
import {welcomeEmailTemplate } from "../utils/welcome_template";

import nodemailer from 'nodemailer';
export interface WelcomeEmailData {
  shopDomain: string;
  plan: string;
  price: number;
  recivederEmail:string;
}
// ✅ Create a reusable SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for others
  auth: {
    user: process.env.SMTP_USER || 'rohit45.tawar@gmail.com',
    pass: process.env.SMTP_PASS || 'ftju effl jzrk ghxr',
  },
});

// Verify SMTP configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ [EMAIL] SMTP connection failed:', error);
  } else {
    console.log('✅ [EMAIL] SMTP server is ready to send emails');
  }
});

export async function sendWelcomeEmail(
  shopDomain: string,
  plan: string,
  price: number,
  recivederEmail:string
): Promise<void> {
  console.log('📧 [EMAIL] Starting welcome email process...');
  console.log('📧 [EMAIL] Email parameters:', { shopDomain, plan, price });

  if (!process.env.SMTP_FROM_EMAIL) {
    console.warn('⚠️ [EMAIL] SMTP_FROM_EMAIL not configured, skipping email');
    return;
  }

  const planNames = {
    basic: 'Basic',
    pro: 'Pro',
    business: 'Business',
  };
const planName = planNames[plan as keyof typeof planNames] || plan;
  const msg = {
    to: 'rohit45.tawar@gmail.com',
    from: process.env.SMTP_FROM_EMAIL,
    subject: `Welcome to ${planName} Plan!`,
    html: welcomeEmailTemplate({shopName:shopDomain,}),
  };

  try {
    console.log('📤 [EMAIL] Sending welcome email via SMTP...');
    await transporter.sendMail(msg);
    console.log(`✅ [EMAIL] Welcome email sent successfully to ${shopDomain}`);
  } catch (error) {
    console.error('❌ [EMAIL] Error sending welcome email:', error);
    throw error;
  }
}

export async function sendCancellationEmail(
  shopDomain: string,
  plan: string,
  username:string,
  recipientEmail:string
): Promise<void> {
  if (!process.env.SMTP_FROM_EMAIL) {
    console.warn('⚠️ [EMAIL] SMTP_FROM_EMAIL not configured, skipping cancellation email');
    return;
  }
  const planNames = { basic: 'Basic', pro: 'Pro', business: 'Business' };
  const planName = planNames[plan as keyof typeof planNames] || plan;

  const msg = {
    to: recipientEmail,
    from: process.env.SMTP_FROM_EMAIL,
    subject: `Subscription Cancelled - ${planName} Plan`,
    html: cancellationEmailTemplate({shopName:shopDomain, planName, cancelDate: '26-12-2025' ,username}),
  };
  try {
    await transporter.sendMail(msg);
    console.log(`✅ [EMAIL] Cancellation email sent successfully to ${shopDomain}`);
  } catch (error) {
    console.error('❌ [EMAIL] Error sending cancellation email:', error);
  }
}

export async function sendExpirationEmail(
  shopDomain: string,
  plan: string
): Promise<void> {
  console.log('📧 [EMAIL] Starting expiration email process...');

  if (!process.env.SMTP_FROM_EMAIL) {
    console.warn('⚠️ [EMAIL] SMTP_FROM_EMAIL not configured, skipping expiration email');
    return;
  }

  const planNames = { basic: 'Basic', pro: 'Pro', business: 'Business' };
  const planName = planNames[plan as keyof typeof planNames] || plan;

  const msg = {
    to: `rohit45.tawar@gmail.com`,
    from: process.env.SMTP_FROM_EMAIL,
    subject: `Your ${planName} Plan Has Expired`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc3545;">Subscription Expired</h1>
        <p>Your <strong>${planName} Plan</strong> subscription has expired.</p>
        <p>You can resubscribe anytime to regain full access.</p>
      </div>
    `,
  };

  try {
    console.log('📤 [EMAIL] Sending expiration email via SMTP...');
    await transporter.sendMail(msg);
    console.log(`✅ [EMAIL] Expiration email sent successfully to ${shopDomain}`);
  } catch (error) {
    console.error('❌ [EMAIL] Error sending expiration email:', error);
  }
}
