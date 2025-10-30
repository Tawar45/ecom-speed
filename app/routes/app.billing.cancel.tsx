import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { sendCancellationEmail } from "../utils/email.server";
import type { ActionFunctionArgs } from "react-router";

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log(" ----> [BILLING CANCEL API] Starting cancellation process...");
  const { admin, session } = await authenticate.admin(request);
  try {
    // Step 1: Get active subscriptions from Shopify
    const query = `
      query {
        currentAppInstallation {
          activeSubscriptions {
            id
            name
            status
          }
        }
      }
    `;
    const response = await admin.graphql(query);
    const data = await response.json();
    console.log(" ----> [BILLING CANCEL API query] GraphQL response:", data);

    const activeSubscriptions = data?.data?.currentAppInstallation?.activeSubscriptions || [];
    if (activeSubscriptions.length === 0) {
      return new Response(JSON.stringify({ error: "No active subscription found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const subscriptionId = activeSubscriptions[0].id;

    // Step 2: Cancel the subscription
    const mutation = `
      mutation appSubscriptionCancel($id: ID!) {
        appSubscriptionCancel(id: $id) {
          appSubscription { id status }
          userErrors { field message }
        }
      }
    `;
    const cancelResponse = await admin.graphql(mutation, { variables: { id: subscriptionId } });
    const cancelData = await cancelResponse.json();
    console.log(" ----> [BILLING CANCEL API mutation] GraphQL response:", cancelData);

    const userErrors = cancelData?.data?.appSubscriptionCancel?.userErrors || [];
    if (userErrors.length > 0) {
      return new Response(JSON.stringify({ error: userErrors[0].message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Update local database
    const shop = await (prisma as any).shop.findUnique({
      where: { domain: session.shop },
    });

    if (shop) {
      await (prisma as any).subscription.updateMany({
        where: { shopId: shop.id, status: "active" },
        data: { status: "cancelled", updatedAt: new Date() },
      });

      // Send cancellation email
      const cancelledSubscription = await (prisma as any).subscription.findFirst({
        where: { shopId: shop.id, status: "cancelled" },
        orderBy: { updatedAt: "desc" },
      });

      if (cancelledSubscription) {
        try {
          await sendCancellationEmail(session.shop, cancelledSubscription.plan);
        } catch (err) {
          console.error("Failed to send cancellation email:", err);
        }
      }
    }

    // Step 4: Return JSON response
    return new Response(JSON.stringify({ success: true, message: "Subscription cancelled successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Subscription cancellation error:", error);
    return new Response(JSON.stringify({ error: "Failed to cancel subscription" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
