import { cancellationEmailTemplate } from "../utils/cancel_subscription_template";
// import {welcomeEmailTemplate } from "../utils/welcome_template";
import { PrismaClient } from "@prisma/client";
import { getShopInfo } from "./graphql-query";
import nodemailer from 'nodemailer';
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

function readNumberEnv(name: string, fallback: number): number {
  const raw = readEnv(name);
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readBooleanEnv(name: string): boolean | undefined {
  const raw = readEnv(name)?.toLowerCase();
  if (!raw) return undefined;
  if (raw === "true") return true;
  if (raw === "false") return false;
  return undefined;
}

function normalizeSmtpPassword(password?: string, host?: string): string | undefined {
  if (!password) return undefined;
  const normalizedHost = host?.toLowerCase() ?? "";
  if (
    normalizedHost.includes("gmail.com") &&
    /^[a-z0-9]{4}( [a-z0-9]{4}){3}$/i.test(password)
  ) {
    return password.replace(/\s+/g, "");
  }
  return password;
}

function logEmailError(context: string, error: unknown) {
  console.error(`[EMAIL] Error sending ${context}:`, error);

  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "ETIMEDOUT"
  ) {
    console.error(
      `[EMAIL] SMTP connection to ${smtpHost}:${smtpPort} timed out. ` +
        "This usually means the server cannot reach the SMTP host or that the host/port pair is blocked."
    );
  }

  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "EAUTH"
  ) {
    console.error(
      "[EMAIL] SMTP authentication failed. For Gmail, use the full Gmail address as SMTP_USER and a valid 16-character app password as SMTP_PASS."
    );
  }
}

const emailEnabled = readBooleanEnv("EMAIL_ENABLED") !== false;
const smtpHost = readEnv("SMTP_HOST");
const smtpPort = readNumberEnv("SMTP_PORT", 587);
const smtpUser = readEnv("SMTP_USER");
const smtpPass = normalizeSmtpPassword(readEnv("SMTP_PASS"), smtpHost);
const smtpFrom = readEnv("SMTP_FROM_EMAIL");
const smtpSecure = readBooleanEnv("SMTP_SECURE") ?? smtpPort === 465;
const smtpConnectionTimeout = readNumberEnv("SMTP_CONNECTION_TIMEOUT", 10000);
const smtpGreetingTimeout = readNumberEnv("SMTP_GREETING_TIMEOUT", 10000);
const smtpSocketTimeout = readNumberEnv("SMTP_SOCKET_TIMEOUT", 10000);
const isSmtpConfigured = Boolean(emailEnabled && smtpHost && smtpUser && smtpPass && smtpFrom);

const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: smtpConnectionTimeout,
      greetingTimeout: smtpGreetingTimeout,
      socketTimeout: smtpSocketTimeout,
      tls: {
        servername: smtpHost,
      },
    })
  : null;

export async function sendWelcomeEmailInstalledMaill(ShopInfo: any): Promise<boolean> {
  if (!transporter || !smtpFrom) {
    console.warn(" [EMAIL] SMTP not configured, skipping welcome email");
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
    from: smtpFrom,
    subject: `Welcome - ${shopName} Plan`,
    html: welcomeEmailTemplate({
      shopName,
      planName: "Premium",
    }),
  };

  try {
    await transporter.sendMail(msg);
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

  if (!transporter || !smtpFrom) {
    console.warn('[EMAIL] SMTP not configured, skipping email');
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
    from: smtpFrom,
    subject: `Welcome to ${planName} Plan!`,
    html: welcomeEmailTemplate({ shopName: shopDomain, planName }),
  };

  try {
    await transporter.sendMail(msg);
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
  if (!transporter || !smtpFrom) {
    console.warn('[EMAIL] SMTP not configured, skipping cancellation email');
    return;
  }
  const planNames = { basic: 'Basic', pro: 'Pro', business: 'Business' };
  const planName = planNames[plan as keyof typeof planNames] || plan;

  const msg = {
    to: recipientEmail,
    from: smtpFrom,
    subject: `Subscription Cancelled - ${planName} Plan`,
    html: cancellationEmailTemplate({ shopName: shopDomain, planName, cancelDate: '26-12-2025', username }),
  };
  try {
    await transporter.sendMail(msg);
  } catch (error) {
    logEmailError("cancellation email", error);
  }
}

export async function sendExpirationEmail(
  shopDomain: string,
  plan: string,
  recepientEmail: string
): Promise<void> {

  if (!transporter || !smtpFrom) {
    console.warn('[EMAIL] SMTP not configured, skipping expiration email');
    return;
  }

  const planNames = { basic: 'Basic', pro: 'Pro', business: 'Business' };
  const planName = planNames[plan as keyof typeof planNames] || plan;
  const msg = {
    to: recepientEmail,
    from: smtpFrom,
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
    await transporter.sendMail(msg);
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
