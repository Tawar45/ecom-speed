import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { sendExpirationEmail } from "../utils/email.server";
import type { ActionFunctionArgs } from "react-router";
import {sendWelcomeEmail} from "../utils/email.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  
  try {
    // Authenticate the webhook request
    const { admin, session, topic, shop, payload } = await authenticate.webhook(request);
    
    // Parse the payload - check if it's already an object
    const subscriptionData = typeof payload === 'string' 
      ? JSON.parse(payload) 
      : payload;

    // Extract subscription information
    const subscriptionId = subscriptionData.app_subscription.admin_graphql_api_id;
    const subscriptionName = subscriptionData.app_subscription.name || '';
    const status = subscriptionData.app_subscription.status || '';
    const test = subscriptionData.app_subscription.test || false;

    

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


    // Handle different subscription statuses
    switch (status.toLowerCase()) {
      case 'cancelled':
        await handleSubscriptionCancellation(shopRecord, plan, subscriptionId);
        break;
      
      case 'expired':
      case 'declined':
        await handleSubscriptionExpiration(shopRecord, plan, subscriptionId);
        break;
      
      case 'active':
        await handleSubscriptionActivation(shopRecord, plan, subscriptionId);
        break;
      
      case 'pending':
        await handleSubscriptionPending(shopRecord, plan);
        break;
      
      default:
        // Update subscription in database with current status
        await updateSubscriptionStatus(shopRecord.id, plan, status);
    }

    
     
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

}

// Handle subscription expiration
async function handleSubscriptionExpiration(shop: any, plan: string, subscriptionId: string) {
  
 // 1. Fetch active subscription
const subscription = await prisma.subscription.findFirst({
  where: {
    shopId: shop.id,
    status: "active",
  },
});

if (!subscription || !subscription.email) {
  console.warn("⚠ No active subscription found for shop:", shop.domain);
  return;
}

// 2. Update subscription to expired
const updated = await prisma.subscription.update({
  where: { id: subscription.id },
  data: {
    status: "expired",
    updatedAt: new Date(),
  },
});

  // Send expiration email
  try {
    await sendExpirationEmail(shop.domain, plan,subscription.email);
  } catch (emailError) {
    console.error("[SUBSCRIPTION WEBHOOK] Failed to send expiration email:", emailError);
    // Don't fail the webhook if email fails
  }
}

// Handle subscription activation/renewal
async function handleSubscriptionActivation(shop: any, plan: string, subscriptionId: string) {
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
  }
}

// Handle pending subscription
async function handleSubscriptionPending(shop: any, plan: string) {
  
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

