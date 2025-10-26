import { Form, useActionData, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";
import { sendCancellationEmail } from "../utils/email.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  
  try {
    // Get current subscription from database
    const shop = await (prisma as any).shop.findUnique({
      where: { domain: session.shop },
      include: {
        subscriptions: {
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    if (!shop || shop.subscriptions.length === 0) {
      return { error: "No active subscription found" };
    }

    const subscription = shop.subscriptions[0];
    return { subscription };
  } catch (error) {
    console.error("Error loading subscription:", error);
    return { error: "Failed to load subscription" };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {


  console.log(" ----> [BILLING CANCEL ACTION] Starting cancellation process...");
  const { admin, session } = await authenticate.admin(request);
  
  try {
    // Get current app installation and active subscriptions
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
    console.log(" ----> [BILLING CANCEL ACTION query-------] GraphQL response:     --=-=-=-=-=-", data);
    const activeSubscriptions = data.data.currentAppInstallation.activeSubscriptions;
    
    if (activeSubscriptions.length === 0) {
      return { error: "No active subscription found" };
    }

    const subscriptionId = activeSubscriptions[0].id;

    // Cancel subscription using Shopify GraphQL
    const mutation = `
      mutation appSubscriptionCancel($id: ID!) {
        appSubscriptionCancel(id: $id) {
          appSubscription {
            id
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = { id: subscriptionId };
    const cancelResponse = await admin.graphql(mutation, { variables });
    const cancelData = await cancelResponse.json();
    console.log(" ----> [BILLING CANCEL ACTION cancelResponse-------] GraphQL response:     --=-=-=-=-=-", cancelData);
    if (cancelData.data.appSubscriptionCancel.userErrors.length > 0) {
      return { error: cancelData.data.appSubscriptionCancel.userErrors[0].message };
    }

    // Update database
    const shop = await (prisma as any).shop.findUnique({
      where: { domain: session.shop }
    });

    if (shop) {
      await (prisma as any).subscription.updateMany({
        where: { 
          shopId: shop.id, 
          status: "active" 
        },
        data: { 
          status: "cancelled",
          updatedAt: new Date()
        }
      });

      // Get the cancelled subscription for email
      const cancelledSubscription = await (prisma as any).subscription.findFirst({
        where: { 
          shopId: shop.id, 
          status: "cancelled" 
        },
        orderBy: { updatedAt: "desc" }
      });

      // Send cancellation email
      if (cancelledSubscription) {
        try {
          await sendCancellationEmail(session.shop, cancelledSubscription.plan);
        } catch (emailError) {
          console.error("Failed to send cancellation email:", emailError);
          // Don't fail the whole process if email fails
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Subscription cancellation error:", error);
    return { error: "Failed to cancel subscription" };
  }
};

export default function CancelSubscription() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  if (actionData?.success) {
    return (
      <s-page heading="Subscription Cancelled">
        <s-section heading="Cancellation Confirmed">
          <s-banner tone="info">
            <s-paragraph>
              Your subscription has been successfully cancelled. 
              You will continue to have access until the end of your current billing period.
            </s-paragraph>
          </s-banner>
          
          <s-paragraph>
            You can resubscribe at any time by visiting our pricing page.
          </s-paragraph>
          
          <s-button-group>
            <s-button variant="primary" href="/app/pricing">
              View Plans
            </s-button>
            <s-button href="/app">
              Go to Dashboard
            </s-button>
          </s-button-group>
        </s-section>
      </s-page>
    );
  }

  return (
    <s-page heading="Cancel Subscription">
      <s-section heading="Are you sure you want to cancel?">
        {actionData?.error && (
          <s-banner tone="critical">
            <s-paragraph>Error: {actionData.error}</s-paragraph>
          </s-banner>
        )}
        
        <s-paragraph>
          Cancelling your subscription will:
        </s-paragraph>
        
        <s-unordered-list>
          <s-list-item>Stop future billing</s-list-item>
          <s-list-item>Keep your access until the end of the current billing period</s-list-item>
          <s-list-item>Allow you to resubscribe at any time</s-list-item>
        </s-unordered-list>
        
        <s-paragraph>
          <strong>Choose an option below:</strong>
        </s-paragraph>
        
        <Form method="post">
          <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <s-button 
              type="submit" 
              variant="primary" 
              tone="critical"
              loading={navigation.state === "submitting"}
              disabled={navigation.state === "submitting"}
            >
              Yes, Cancel Subscription
            </s-button>
            <s-button href="/app">
              Keep Subscription
            </s-button>
          </div>
          
          {/* Fallback HTML buttons in case Polaris components don't render */}
          {/* <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button 
              type="submit" 
              style={{ 
                backgroundColor: "#d82c0d", 
                color: "white", 
                border: "none", 
                padding: "12px 24px", 
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600"
              }}
              disabled={navigation.state === "submitting"}
            >
              {navigation.state === "submitting" ? "Cancelling..." : "Yes, Cancel Subscription"}
            </button>
            <a 
              href="/app"
              style={{ 
                backgroundColor: "#f6f6f7", 
                color: "#202223", 
                border: "1px solid #d1d3d4", 
                padding: "12px 24px", 
                borderRadius: "4px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "600",
                display: "inline-block"
              }}
            >
              Keep Subscription
            </a>
          </div> */}
        </Form>
      </s-section>
    </s-page>
  );
}
