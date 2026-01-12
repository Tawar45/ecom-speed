import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { sendWelcomeEmail } from "../utils/email.server";
import type { ActionFunctionArgs } from "react-router";

export const action = async ({ request }: ActionFunctionArgs) => {
  
  try {
    // Authenticate the webhook request
    const { admin, session, topic, shop, payload } = await authenticate.webhook(request);
    
    // Parse the payload to get subscription details
    const subscriptionData = JSON.parse(payload as unknown as string);

    // Extract subscription information
    const subscription = subscriptionData;
    const plan = subscription.name?.toLowerCase().replace(" plan", "") || "basic";
    const price = parseFloat(subscription.price || "0");

    // Get or create shop record
    let shopRecord = await (prisma as any).shop.findUnique({
      where: { domain: shop }
    });

    if (!shopRecord) {
      shopRecord = await (prisma as any).shop.create({
        data: {
          domain: shop,
          accessToken: session?.accessToken || "webhook_token"
        }
      });
    } else {
      await (prisma as any).shop.update({
        where: { id: shopRecord.id },
        data: { accessToken: session?.accessToken || "webhook_token" }
      });
    }

    // Create or update subscription
    const existingSubscription = await (prisma as any).subscription.findFirst({
      where: { shopId: shopRecord.id, status: "active" }
    });

    if (existingSubscription) {
      await (prisma as any).subscription.update({
        where: { id: existingSubscription.id },
        data: {
          plan,
          price,
          status: "active"
        }
      });
    } else {
      const newSubscription = await (prisma as any).subscription.create({
        data: {
          shopId: shopRecord.id,
          plan,
          price,
          status: "active"
        }
      });
    }

    // Send welcome email
    try {
      const recipientEmail="rohit45.tawar@gmail.com";
      await sendWelcomeEmail(shop, plan, price,recipientEmail);
    } catch (emailError) {
      console.error(" [BILLING WEBHOOK] Failed to send welcome email:", emailError);
      // Don't fail the whole process if email fails
    }

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
