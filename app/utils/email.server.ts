import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface WelcomeEmailData {
  shopDomain: string;
  plan: string;
  price: number;
}

export async function sendWelcomeEmail(
  shopDomain: string, 
  plan: string, 
  price: number
): Promise<void> {
  console.log("📧 [EMAIL] Starting welcome email process...");
  console.log("📧 [EMAIL] Email parameters:", { shopDomain, plan, price });
  
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('⚠️ [EMAIL] SENDGRID_API_KEY not configured, skipping email');
    return;
  }

  if (!process.env.SENDGRID_FROM_EMAIL) {
    console.warn('⚠️ [EMAIL] SENDGRID_FROM_EMAIL not configured, skipping email');
    return;
  }
  
  console.log("✅ [EMAIL] Email configuration validated");

  const planNames = {
    basic: 'Basic',
    pro: 'Pro', 
    business: 'Business'
  };

  const planName = planNames[plan as keyof typeof planNames] || plan;

  const msg = {
    to: `admin@${shopDomain}`, // You might want to get the actual merchant email
    from: process.env.SENDGRID_FROM_EMAIL,
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
            <li style="margin: 8px 0;"><strong>Status:</strong> Active</li>
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
        
        <p>If you have any questions or need support, please don't hesitate to reach out to us.</p>
        
        <p>Best regards,<br>The Team</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This email was sent to ${shopDomain}. If you have any questions about your subscription, please contact our support team.
        </p>
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

You now have access to all the features included in your plan. Here's what you can do next:

- Access your dashboard to manage your subscription
- Explore all the features available in your plan
- Contact our support team if you need any assistance

Go to Dashboard: ${process.env.SHOPIFY_APP_URL}/app

If you have any questions or need support, please don't hesitate to reach out to us.

Best regards,
The Team

---
This email was sent to ${shopDomain}. If you have any questions about your subscription, please contact our support team.
    `
  };

  try {
    console.log("📤 [EMAIL] Sending welcome email via SendGrid...");
    console.log("📤 [EMAIL] Email details:", {
      to: msg.to,
      from: msg.from,
      subject: msg.subject,
      hasHtml: !!msg.html,
      hasText: !!msg.text
    });
    
    await sgMail.send(msg);
    console.log(`✅ [EMAIL] Welcome email sent successfully to ${shopDomain}`);
  } catch (error) {
    console.error('❌ [EMAIL] Error sending welcome email:', {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    throw error;
  }
}

export async function sendCancellationEmail(
  shopDomain: string,
  plan: string
): Promise<void> {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.warn('Email configuration missing, skipping cancellation email');
    return;
  }

  const planNames = {
    basic: 'Basic',
    pro: 'Pro',
    business: 'Business'
  };

  const planName = planNames[plan as keyof typeof planNames] || plan;

  const msg = {
    to: `admin@${shopDomain}`,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: `Subscription Cancelled - ${planName} Plan`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Subscription Cancelled</h1>
        
        <p>Hello,</p>
        
        <p>Your <strong>${planName} Plan</strong> subscription has been successfully cancelled.</p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="margin-top: 0; color: #856404;">Important Information:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 8px 0;">Your subscription will remain active until the end of your current billing period</li>
            <li style="margin: 8px 0;">You will not be charged for the next billing cycle</li>
            <li style="margin: 8px 0;">You can resubscribe at any time</li>
          </ul>
        </div>
        
        <p>We're sorry to see you go! If you change your mind, you can always resubscribe to any of our plans.</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${process.env.SHOPIFY_APP_URL}/app/pricing" 
             style="background-color: #007cba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View Plans
          </a>
        </div>
        
        <p>If you have any questions or feedback, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>The Team</p>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`Cancellation email sent successfully to ${shopDomain}`);
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    throw error;
  }
}

export async function sendExpirationEmail(
  shopDomain: string,
  plan: string
): Promise<void> {
  console.log("📧 [EMAIL] Starting expiration email process...");
  console.log("📧 [EMAIL] Email parameters:", { shopDomain, plan });
  
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.warn('⚠️ [EMAIL] Email configuration missing, skipping expiration email');
    return;
  }

  const planNames = {
    basic: 'Basic',
    pro: 'Pro',
    business: 'Business'
  };

  const planName = planNames[plan as keyof typeof planNames] || plan;

  const msg = {
    to: `admin@${shopDomain}`,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: `Your ${planName} Plan Has Expired`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc3545;">Subscription Expired</h1>
        
        <p>Hello,</p>
        
        <p>We wanted to let you know that your <strong>${planName} Plan</strong> subscription has expired.</p>
        
        <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3 style="margin-top: 0; color: #721c24;">What This Means:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 8px 0;">Your access to premium features has ended</li>
            <li style="margin: 8px 0;">You can still access basic features</li>
            <li style="margin: 8px 0;">You can resubscribe to regain full access</li>
          </ul>
        </div>
        
        <p>Don't worry! You can reactivate your subscription at any time to continue enjoying all the benefits of the ${planName} Plan.</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${process.env.SHOPIFY_APP_URL}/app/pricing" 
             style="background-color: #007cba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Re-subscribe Now
          </a>
        </div>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        
        <p>Best regards,<br>The Team</p>
      </div>
    `,
    text: `
Subscription Expired

Hello,

We wanted to let you know that your ${planName} Plan subscription has expired.

What This Means:
- Your access to premium features has ended
- You can still access basic features
- You can resubscribe to regain full access

Don't worry! You can reactivate your subscription at any time to continue enjoying all the benefits of the ${planName} Plan.

Re-subscribe Now: ${process.env.SHOPIFY_APP_URL}/app/pricing

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
The Team
    `
  };

  try {
    console.log("📤 [EMAIL] Sending expiration email via SendGrid...");
    await sgMail.send(msg);
    console.log(`✅ [EMAIL] Expiration email sent successfully to ${shopDomain}`);
  } catch (error) {
    console.error('❌ [EMAIL] Error sending expiration email:', error);
    throw error;
  }
}