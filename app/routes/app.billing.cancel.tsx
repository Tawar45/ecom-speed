import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { sendCancellationEmail } from "../utils/email.server";
import type { ActionFunctionArgs } from "react-router";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  try {
    const formData = await request.formData();
    const isConfirmed = formData.get("confirmCancel") === "true";
    if (!isConfirmed) {
      return new Response(
        JSON.stringify({ success: false, error: "Cancellation not confirmed" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 1: Get active subscriptions from Shopify
    const query = `
      query {
      shop {
        id
        name
        email
        myshopifyDomain
      }
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
    let username = data?.data?.shop.name;
    let recipientEmail = data?.data?.shop.email;
    const activeSubscriptions = data?.data?.currentAppInstallation?.activeSubscriptions || [];
    if (activeSubscriptions.length === 0) {
      const shop = await (prisma as any).shop.findUnique({
        where: { domain: session.shop },
      });
      if (shop) {
        await (prisma as any).subscription.updateMany({
          where: { shopId: shop.id, status: "active" },
          data: { status: "cancelled", updatedAt: new Date() },
        });
      }
      return new Response(JSON.stringify({ success: true, message: "No active subscription to cancel" }), {
        status: 200,
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

    const userErrors = cancelData?.data?.appSubscriptionCancel?.userErrors || [];
    if (userErrors.length > 0) {
      return new Response(JSON.stringify({ success: false, error: userErrors[0].message }), {
        status: 200,
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
        void sendCancellationEmail(
          session.shop,
          cancelledSubscription.plan,
          username,
          recipientEmail
        ).catch((err) => {
          console.error("Failed to send cancellation email:", err);
        });
      }
    }

    // Step 4: Return JSON response
    return new Response(JSON.stringify({ success: true, message: "Subscription cancelled successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Subscription cancellation error:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to cancel subscription. Please try again." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
