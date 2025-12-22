import { cancellationEmailTemplate } from "../utils/cancel_subscription_template";
// import {welcomeEmailTemplate } from "../utils/welcome_template";
import { PrismaClient } from "@prisma/client";
import { getShopInfo } from "./graphql-query";
import nodemailer from 'nodemailer';
import { welcomeEmailTemplate } from "./welcome_template";
import { weeklyEmailTemplate } from "./weekly_template";

export interface WelcomeEmailData {
  shopDomain: string;
  plan: string;
  price: number;
  recivederEmail: string;
  planName: string;
  datetime:string;
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

export async function sendWelcomeEmailInstalledMaill(ShopInfo: any) {
  if (!process.env.SMTP_FROM_EMAIL) {
    console.warn(" [EMAIL] SMTP_FROM_EMAIL not configured, skipping welcome email");
    return;
  }

  // FIX: pick the correct email field
  const recipientEmail =
    ShopInfo.email ||
    ShopInfo.contactEmail ||
    null;

  if (!recipientEmail) {
    console.error(" [EMAIL] No valid email found in ShopInfo:", ShopInfo);
    return;
  }

  const shopName = ShopInfo.name || "Your Store";

  const msg = {
    to: recipientEmail, // FIXED
    from: process.env.SMTP_FROM_EMAIL,
    subject: `Welcome - ${shopName} Plan`,
    html: welcomeEmailTemplate({
      shopName,
      planName: "Premium",
    }),
  };

  try {
    return await transporter.sendMail(msg);
  } catch (error) {
    console.error(" [EMAIL] Error sending welcome email:", error);
    return null;
  }
}

export async function sendWelcomeEmail(
  shopDomain: string,
  plan: string,
  price: number,
  recivederEmail: string
): Promise<void> {

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
    to: recivederEmail,  //'rohit45.tawar@gmail.com',
    from: process.env.SMTP_FROM_EMAIL,
    subject: `Welcome to ${planName} Plan!`,
    html: welcomeEmailTemplate({ shopName: shopDomain, planName: 'planName' }),
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

export async function sendWeekEmail(
  shopDomain: string,
  recivederEmail: string,
  currentDateUTC:Date ,
  afterOneWeekUTC:Date,
): Promise<void> {

  if (!process.env.SMTP_FROM_EMAIL) {
    console.warn('⚠️ [EMAIL] SMTP_FROM_EMAIL not configured, skipping email');
    return;
  }

  const msg = {
    to: recivederEmail,  //'rohit45.tawar@gmail.com',
    from: process.env.SMTP_FROM_EMAIL,
    subject: `Weekly Report`,
    html: weeklyEmailTemplate({ shopName: shopDomain, currentDateUTC,afterOneWeekUTC}),
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
  username: string,
  recipientEmail: string
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
    html: cancellationEmailTemplate({ shopName: shopDomain, planName, cancelDate: '26-12-2025', username }),
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
  plan: string,
  recepientEmail: string
): Promise<void> {
  console.log('📧 [EMAIL] Starting expiration email process...');

  if (!process.env.SMTP_FROM_EMAIL) {
    console.warn('⚠️ [EMAIL] SMTP_FROM_EMAIL not configured, skipping expiration email');
    return;
  }

  const planNames = { basic: 'Basic', pro: 'Pro', business: 'Business' };
  const planName = planNames[plan as keyof typeof planNames] || plan;

  const msg = {
    to: recepientEmail,
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

export async function handleShopSession(
  prisma: PrismaClient,
  session: any,
  admin: any                     // whatever your Shopify admin instance type is
) {
  try {
    // -------------------------------
    const info = await getShopInfo(admin);
    const shopEmail = info?.email;
    // 1. Find existing shop (with last subscription)
    // -------------------------------
    let shop = await prisma.shop.findUnique({
      where: { domain: session.shop },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    // -------------------------------
    // 2. If shop NOT found → create
    // -------------------------------
    if (!shop) {
       shop = await prisma.shop.create({
        data: {
          domain: session.shop,
          accessToken: session.accessToken,
          email: shopEmail,  
          lastWeeklyEmailAt: new Date(), // ✅ INIT timestamp
        },
      });
      return shop;
    }
    // -------------------------------
    // Send welcome email (only once)
    // -------------------------------
    if (!shop.welcomeEmailSent) {
      try {
        const info = await getShopInfo(admin);

        const res = await sendWelcomeEmailInstalledMaill(info);
        if (!res) {
          console.error("[DASHBOARD] Failed to send welcome email: No response from email function");
          return shop;
        }
        await prisma.shop.update({
          where: { domain: session.shop },
          data: {
            welcomeEmailSent: true,
             email: shopEmail,  
          },
        });
      } catch (err) {
        console.error("[DASHBOARD] Failed to send welcome email:", err);
      }
    }
    // -------------------------------
    // 3. If shop exists → update token
    // -------------------------------
    await prisma.shop.update({
      where: { id: shop.id },
      data: {
        accessToken: session.accessToken,
         email: shopEmail,       
      },
    });

    return shop;
  } catch (error) {
    console.error("[SHOP UTILS] Error in handleShopSession:", error);
    throw error;
  }
}
