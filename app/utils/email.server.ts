import { cancellationEmailTemplate } from "../utils/cancel_subscription_template";
// import {welcomeEmailTemplate } from "../utils/welcome_template";
import { PrismaClient } from "@prisma/client";
import sgMail, { type MailDataRequired } from "@sendgrid/mail";
import { getShopInfo } from "./graphql-query";
import { welcomeEmailTemplate } from "./welcome_template";

export interface WelcomeEmailData {
  shopDomain: string;
  plan: string;
  price: number;
  recivederEmail: string;
  planName: string;
}

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  if (!value) return undefined;
  return value.replace(/^['"]|['"]$/g, "");
}

function readBooleanEnv(name: string): boolean | undefined {
  const raw = readEnv(name)?.toLowerCase();
  if (!raw) return undefined;
  if (raw === "true") return true;
  if (raw === "false") return false;
  return undefined;
}

function logEmailError(context: string, error: unknown) {
  console.error(`[EMAIL] Error sending ${context}:`, error);

  if (
    error &&
    typeof error === "object" &&
    "response" in error
  ) {
    const response = (error as {
      response?: { body?: { errors?: Array<{ message?: string }> } };
    }).response;
    const apiErrors = response?.body?.errors?.map((entry) => entry.message).filter(Boolean);
    if (apiErrors?.length) {
      console.error(`[EMAIL] SendGrid response for ${context}: ${apiErrors.join(" | ")}`);
    }
  }
}

const emailEnabled = readBooleanEnv("EMAIL_ENABLED") !== false;
const sendgridApiKey = readEnv("SENDGRID_API_KEY");
const emailFrom = readEnv("SENDGRID_FROM_EMAIL") ?? readEnv("SMTP_FROM_EMAIL");
const sendgridFromName = readEnv("SENDGRID_FROM_NAME");
const isSendGridConfigured = Boolean(emailEnabled && sendgridApiKey && emailFrom);

if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
}

function buildFromField(): MailDataRequired["from"] {
  if (!emailFrom) {
    throw new Error("[EMAIL] Missing sender email configuration");
  }

  return sendgridFromName
    ? {
        email: emailFrom,
        name: sendgridFromName,
      }
    : emailFrom;
}

function htmlToText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

type AppEmailMessage = {
  to: MailDataRequired["to"];
  subject: string;
  html: string;
  text?: string;
};

async function sendEmail(message: AppEmailMessage): Promise<void> {
  if (!isSendGridConfigured) {
    throw new Error("[EMAIL] SendGrid is not configured");
  }

  await sgMail.send({
    ...message,
    from: buildFromField(),
    text: message.text ?? htmlToText(message.html),
  });
}

export async function sendWelcomeEmailInstalledMaill(ShopInfo: any): Promise<boolean> {
  if (!isSendGridConfigured) {
    console.warn(" [EMAIL] SendGrid not configured, skipping welcome email");
    return false;
  }

  // FIX: pick the correct email field
  const recipientEmail =
    ShopInfo.email ||
    ShopInfo.contactEmail ||
    null;
console.log('recipientEmail----',recipientEmail);
  if (!recipientEmail) {
    console.error(" [EMAIL] No valid email found in ShopInfo:", ShopInfo);
    return false;
  }

  const shopName = ShopInfo.name || "Your Store";

  const msg = {
    to: recipientEmail, // FIXED
    subject: `Welcome - ${shopName} Plan`,
    html: welcomeEmailTemplate({
      shopName,
      planName: "Premium",
    }),
  };

  try {
    await sendEmail(msg);
    return true;
  } catch (error) {
    logEmailError("welcome email", error);
    return false;
  }
}


export async function sendWelcomeEmail(
  shopDomain: string,
  plan: string,
  price: number,
  recivederEmail: string
): Promise<void> {

  if (!isSendGridConfigured) {
    console.warn('[EMAIL] SendGrid not configured, skipping email');
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
    subject: `Welcome to ${planName} Plan!`,
    html: welcomeEmailTemplate({ shopName: shopDomain, planName }),
  };

  try {
    await sendEmail(msg);
  } catch (error) {
    logEmailError("welcome email", error);
    throw error;
  }
}

export async function sendCancellationEmail(
  shopDomain: string,
  plan: string,
  username: string,
  recipientEmail: string
): Promise<void> {
  console.log('--------------recipientEmail--------------',recipientEmail);
  if (!isSendGridConfigured) {
    console.warn('[EMAIL] SendGrid not configured, skipping cancellation email');
    return;
  }
  const planNames = { basic: 'Basic', pro: 'Pro', business: 'Business' };
  const planName = planNames[plan as keyof typeof planNames] || plan;

  const msg = {
    to: recipientEmail,
    subject: `Subscription Cancelled - ${planName} Plan`,
    html: cancellationEmailTemplate({ shopName: shopDomain, planName, cancelDate: '26-12-2025', username }),
  };
  try {
    await sendEmail(msg);
  } catch (error) {
    logEmailError("cancellation email", error);
  }
}

export async function sendExpirationEmail(
  shopDomain: string,
  plan: string,
  recepientEmail: string
): Promise<void> {

  if (!isSendGridConfigured) {
    console.warn('[EMAIL] SendGrid not configured, skipping expiration email');
    return;
  }

  const planNames = { basic: 'Basic', pro: 'Pro', business: 'Business' };
  const planName = planNames[plan as keyof typeof planNames] || plan;
  const msg = {
    to: recepientEmail,
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
    await sendEmail(msg);
  } catch (error) {
    logEmailError("expiration email", error);
  }
}

export async function handleShopSession(
  prisma: PrismaClient,
  session: any,
  admin: any                     // whatever your Shopify admin instance type is
) {
  try {
    // -------------------------------
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
        },
        include: {
          subscriptions: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });
    }
    if (!shop) {
      throw new Error(`Failed to create or load shop for ${session.shop}`);
    }
    // -------------------------------
    // Send welcome email (only once)
    // -------------------------------
    if (!shop.welcomeEmailSent) {
      try {
        const info = await getShopInfo(admin);
        const sent = await sendWelcomeEmailInstalledMaill(info);
        if (!sent) {
          console.warn("[DASHBOARD] Welcome email was not sent; keeping welcomeEmailSent=false so it can retry later.");
          return shop;
        }
        await prisma.shop.update({
          where: { domain: session.shop },
          data: {
            welcomeEmailSent: true,
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
      },
    });
    return shop;
  } catch (error) {
    console.error("[SHOP UTILS] Error in handleShopSession:", error);
    throw error;
  }
}
