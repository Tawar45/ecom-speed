import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { sendWelcomeEmail } from "../utils/email.server";
import type { ActionFunctionArgs } from "react-router";

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log(" [BILLING WEBHOOK] Starting billing confirmation webhook...");
  
  try {
    // Authenticate the webhook request
    const { admin, session, topic, shop, payload } = await authenticate.webhook(request);
    
    console.log(" [BILLING WEBHOOK] Webhook authenticated");
    console.log(" [BILLING WEBHOOK] Webhook data:", {
      topic,
      shop,
      hasPayload: !!payload
    });

    // Parse the payload to get subscription details
    const subscriptionData = JSON.parse(payload as unknown as string);
    console.log(" [BILLING WEBHOOK] Subscription data:", subscriptionData);

    // Extract subscription information
    const subscription = subscriptionData;
    const plan = subscription.name?.toLowerCase().replace(" plan", "") || "basic";
    const price = parseFloat(subscription.price || "0");

    console.log(" [BILLING WEBHOOK] Extracted plan details:", { plan, price });

    // Get or create shop record
    console.log(" [BILLING WEBHOOK] Looking up shop in database...");
    let shopRecord = await (prisma as any).shop.findUnique({
      where: { domain: shop }
    });

    if (!shopRecord) {
      console.log(" [BILLING WEBHOOK] Creating new shop record...");
      shopRecord = await (prisma as any).shop.create({
        data: {
          domain: shop,
          accessToken: session?.accessToken || "webhook_token"
        }
      });
      console.log(" [BILLING WEBHOOK] Shop created:", { id: shopRecord.id, domain: shopRecord.domain });
    } else {
      console.log(" [BILLING WEBHOOK] Updating existing shop access token...");
      await (prisma as any).shop.update({
        where: { id: shopRecord.id },
        data: { accessToken: session?.accessToken || "webhook_token" }
      });
      console.log(" [BILLING WEBHOOK] Shop updated:", { id: shopRecord.id, domain: shopRecord.domain });
    }

    // Create or update subscription
    console.log(" [BILLING WEBHOOK] Processing subscription in database...");
    const existingSubscription = await (prisma as any).subscription.findFirst({
      where: { shopId: shopRecord.id, status: "active" }
    });

    if (existingSubscription) {
      console.log(" [BILLING WEBHOOK] Updating existing subscription...");
      await (prisma as any).subscription.update({
        where: { id: existingSubscription.id },
        data: {
          plan,
          price,
          status: "active"
        }
      });
      console.log(" [BILLING WEBHOOK] Subscription updated:", { id: existingSubscription.id });
    } else {
      console.log(" [BILLING WEBHOOK] Creating new subscription...");
      const newSubscription = await (prisma as any).subscription.create({
        data: {
          shopId: shopRecord.id,
          plan,
          price,
          status: "active"
        }
      });
      console.log(" [BILLING WEBHOOK] Subscription created:", { id: newSubscription.id });
    }

    // Send welcome email
    console.log(" [BILLING WEBHOOK] Sending welcome email...");
    try {
      await sendWelcomeEmail(shop, plan, price);
      console.log(" [BILLING WEBHOOK] Welcome email sent successfully");
    } catch (emailError) {
      console.error(" [BILLING WEBHOOK] Failed to send welcome email:", emailError);
      // Don't fail the whole process if email fails
    }

    console.log(" [BILLING WEBHOOK] Webhook processing completed successfully");
    return new Response("OK", { status: 200 });

  } catch (error) {
    console.error(" [BILLING WEBHOOK] Unexpected error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    
    return new Response("Error processing webhook", { status: 500 });
  }
};
