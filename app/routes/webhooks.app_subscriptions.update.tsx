import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { sendExpirationEmail } from "../utils/email.server";
import type { ActionFunctionArgs } from "react-router";
import {sendWelcomeEmail} from "../utils/email.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log(" [SUBSCRIPTION WEBHOOK] Starting subscription update webhook...");
  
  try {
    // Authenticate the webhook request
    const { admin, session, topic, shop, payload } = await authenticate.webhook(request);
    
    console.log(" [SUBSCRIPTION WEBHOOK] Webhook authenticated");
    console.log(" [SUBSCRIPTION WEBHOOK] Webhook data:", {
      topic,
      shop,
      hasPayload: !!payload
    });

    // Parse the payload - check if it's already an object
    const subscriptionData = typeof payload === 'string' 
      ? JSON.parse(payload) 
      : payload;
    console.log(" [SUBSCRIPTION WEBHOOK] Subscription data:", subscriptionData);

    // Extract subscription information
    const subscriptionId = subscriptionData.app_subscription.admin_graphql_api_id;
    const subscriptionName = subscriptionData.app_subscription.name || '';
    const status = subscriptionData.app_subscription.status || '';
    const test = subscriptionData.app_subscription.test || false;

    console.log(" [SUBSCRIPTION WEBHOOK] Subscription details:", {
      subscriptionId,
      subscriptionName,
      status,
      test
    });

    // Find the shop in database
    const shopRecord = await (prisma as any).shop.findUnique({
      where: { domain: shop }
    });

    if (!shopRecord) {
      console.error("❌ [SUBSCRIPTION WEBHOOK] Shop not found in database:", shop);
      return new Response("Shop not found", { status: 404 });
    }

    // Extract plan name from subscription name (e.g., "Basic Plan" -> "basic")
    const plan = subscriptionName.toLowerCase().replace(' plan', '').trim();

    console.log(" [SUBSCRIPTION WEBHOOK] Processing status:", status);

    // Handle different subscription statuses
    switch (status.toLowerCase()) {
      case 'cancelled':
        console.log(" [SUBSCRIPTION WEBHOOK] Subscription cancelled");
        await handleSubscriptionCancellation(shopRecord, plan, subscriptionId);
        break;
      
      case 'expired':
      case 'declined':
        console.log(" [SUBSCRIPTION WEBHOOK] Subscription expired/declined");
        await handleSubscriptionExpiration(shopRecord, plan, subscriptionId);
        break;
      
      case 'active':
        console.log(" [SUBSCRIPTION WEBHOOK] Subscription activated/renewed");
        await handleSubscriptionActivation(shopRecord, plan, subscriptionId);
        break;
      
      case 'pending':
        console.log(" [SUBSCRIPTION WEBHOOK] Subscription pending");
        await handleSubscriptionPending(shopRecord, plan);
        break;
      
      default:
        console.log(" [SUBSCRIPTION WEBHOOK] Unknown status:", status);
        // Update subscription in database with current status
        await updateSubscriptionStatus(shopRecord.id, plan, status);
    }

    console.log("✅ [SUBSCRIPTION WEBHOOK] Webhook processed successfully");
    
     
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("❌ [SUBSCRIPTION WEBHOOK] Error processing webhook:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Handle subscription cancellation
async function handleSubscriptionCancellation(shop: any, plan: string, subscriptionId: string) {
  console.log(" [SUBSCRIPTION WEBHOOK] Handling cancellation...");
  
  // Update all active subscriptions for this shop to cancelled
  const updated = await (prisma as any).subscription.updateMany({
    where: {
      shopId: shop.id,
      status: "active"
    },
    data: {
      status: "cancelled",
      updatedAt: new Date()
    }
  });

  console.log(`✅ [SUBSCRIPTION WEBHOOK] Updated ${updated.count} subscription(s) to cancelled status`);
}

// Handle subscription expiration
async function handleSubscriptionExpiration(shop: any, plan: string, subscriptionId: string) {
  console.log(" [SUBSCRIPTION WEBHOOK] Handling expiration...");
  
  // Update subscription to expired status
  const updated = await (prisma as any).subscription.updateMany({
    where: {
      shopId: shop.id,
      status: "active"
    },
    data: {
      status: "expired",
      updatedAt: new Date()
    }
  });

  console.log(`✅ [SUBSCRIPTION WEBHOOK] Updated ${updated.count} subscription(s) to expired status`);

  // Send expiration email
  try {
    await sendExpirationEmail(shop.domain, plan);
    console.log("✅ [SUBSCRIPTION WEBHOOK] Expiration email sent");
  } catch (emailError) {
    console.error("❌ [SUBSCRIPTION WEBHOOK] Failed to send expiration email:", emailError);
    // Don't fail the webhook if email fails
  }
}

// Handle subscription activation/renewal
async function handleSubscriptionActivation(shop: any, plan: string, subscriptionId: string) {
  console.log(" [SUBSCRIPTION WEBHOOK] Handling activation/renewal...");
  
  // Check if there's an existing subscription
  const existingSubscription = await (prisma as any).subscription.findFirst({
    where: { shopId: shop.id }
  });

  if (existingSubscription) {
    // Update existing subscription to active
    await (prisma as any).subscription.update({
      where: { id: existingSubscription.id },
      data: {
        plan,
        status: "active",
        updatedAt: new Date()
      }
    });
    console.log("✅ [SUBSCRIPTION WEBHOOK] Updated existing subscription to active");
  } else {
    // Create new subscription if it doesn't exist
    await (prisma as any).subscription.create({
      data: {
        shopId: shop.id,
        plan,
        price: getPlanPrice(plan),
        status: "active"
      }
    });
    console.log("✅ [SUBSCRIPTION WEBHOOK] Created new active subscription");
  }
}

// Handle pending subscription
async function handleSubscriptionPending(shop: any, plan: string) {
  console.log(" [SUBSCRIPTION WEBHOOK] Handling pending subscription...");
  
  await updateSubscriptionStatus(shop.id, plan, "pending");
}

// Update subscription status
async function updateSubscriptionStatus(shopId: string, plan: string, status: string) {
  const existingSubscription = await (prisma as any).subscription.findFirst({
    where: { shopId }
  });

  if (existingSubscription) {
    await (prisma as any).subscription.update({
      where: { id: existingSubscription.id },
      data: { status, updatedAt: new Date() }
    });
  } else {
    await (prisma as any).subscription.create({
      data: {
        shopId,
        plan,
        price: getPlanPrice(plan),
        status
      }
    });
  }
}

// Get plan price based on plan name
function getPlanPrice(plan: string): number {
  const planPrices: { [key: string]: number } = {
    basic: 10,
    pro: 20,
    business: 30
  };
  return planPrices[plan] || 10;
}

