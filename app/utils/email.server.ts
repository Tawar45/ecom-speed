import nodemailer from 'nodemailer';
export interface WelcomeEmailData {
  shopDomain: string;
  plan: string;
  price: number;
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
  price: number
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
    to: `rohit45.tawar@gmail.com`,
    from: process.env.SMTP_FROM_EMAIL,
    subject: `Welcome to ${planName} Plan!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to Your New Subscription!</h1>
        <p>Hello,</p>
        <p>Thank you for subscribing to our <strong>${planName} Plan</strong> for <strong>$${price}/month</strong>!</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Your Subscription Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 8px 0;"><strong>Plan:</strong> ${planName}</li>
            <li style="margin: 8px 0;"><strong>Price:</strong> $${price}/month</li>
            <li style="margin: 8px 0;"><strong>Shop:</strong> ${shopDomain}</li>
          </ul>
        </div>
        <p>You now have access to all the features included in your plan. Here's what you can do next:</p>
        
        <ul>
          <li>Access your dashboard to manage your subscription</li>
          <li>Explore all the features available in your plan</li>
          <li>Contact our support team if you need any assistance</li>
        </ul>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${process.env.SHOPIFY_APP_URL}/app" 
             style="background-color: #007cba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        <p>Best regards,<br>The Team</p>
      </div>
    `,
    text: `
Welcome to Your New Subscription!

Hello,
Thank you for subscribing to our ${planName} Plan for $${price}/month!

Your Subscription Details:
- Plan: ${planName}
- Price: $${price}/month  
- Shop: ${shopDomain}
- Status: Active

Go to Dashboard: ${process.env.SHOPIFY_APP_URL}/app

Best regards,
The Team
    `,
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
  plan: string
): Promise<void> {
  if (!process.env.SMTP_FROM_EMAIL) {
    console.warn('⚠️ [EMAIL] SMTP_FROM_EMAIL not configured, skipping cancellation email');
    return;
  }

  const planNames = { basic: 'Basic', pro: 'Pro', business: 'Business' };
  const planName = planNames[plan as keyof typeof planNames] || plan;

  const msg = {
    to: `rohit45.tawar@gmail.com`,
    from: process.env.SMTP_FROM_EMAIL,
    subject: `Subscription Cancelled - ${planName} Plan`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Subscription Cancelled</h1>
        <p>Your <strong>${planName} Plan</strong> subscription has been cancelled.</p>
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <ul style="list-style: none; padding: 0;">
            <li>Your subscription will remain active until the end of your billing period.</li>
            <li>You can resubscribe anytime.</li>
          </ul>
        </div>
      </div>
    `,
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
