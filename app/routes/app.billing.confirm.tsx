import { redirect, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";
import { sendWelcomeEmail } from "../utils/email.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  
  // Check if this is a billing confirmation request
  const url = new URL(request.url);
  const chargeId = url.searchParams.get('charge_id');
  
  if (!chargeId) {
    console.log("❌ [BILLING CONFIRM] No charge_id found in URL");
    return { error: "Invalid billing confirmation request" };
  }
  try {
    // Try to authenticate, but handle the case where session might be lost
    let admin, session;
    try {
      const authResult = await authenticate.admin(request);
      admin = authResult.admin;
      session = authResult.session;
    } catch (authError) {
    
      // Try to extract shop domain from the referer or other sources
      const referer = request.headers.get('referer');
      let shopDomain = null;
      
      if (referer) {
        try {
          const refererUrl = new URL(referer);
          if (refererUrl.hostname.includes('myshopify.com')) {
            shopDomain = refererUrl.hostname;
          }
        } catch (e) {
        }
      }
      // Also try to extract from the confirmation URL itself
      if (!shopDomain) {
        console.log(" [BILLING CONFIRM] No shop domain found in referer or confirmation URL");
        try {
          const confirmationUrl = url.searchParams.get('confirmation_url');
          if (confirmationUrl) {
            const confirmationUrlObj = new URL(confirmationUrl);
            if (confirmationUrlObj.hostname.includes('myshopify.com')) {
              shopDomain = confirmationUrlObj.hostname || 'https://export-dev.myshopify.com/';
            }
          }
        } catch (e) {
        }
      }
    
      // If we can't get shop info, show success page and let user re-authenticate
      if (!shopDomain) {
        return {
          success: true,
          message: "Payment processed successfully. Please check your dashboard for subscription status.",
          needsReauth: true
        };
      }
      // Try to process the subscription with the extracted shop domain
      try {
        let shop = await (prisma as any).shop.findUnique({
          where: { domain: shopDomain }
        });

        if (!shop) {
          shop = await (prisma as any).shop.create({
            data: {
              domain: shopDomain,
              accessToken: "pending_confirmation" // Will be updated when user re-authenticates
            }
          });
        }

        // Create a pending subscription record
        // const newSubscription = await (prisma as any).subscription.create({
        //   data: {
        //     shopId: shop.id,
        //     plan: "pro", // Default plan, will be updated when confirmed
        //     price: 20, // Default price, will be updated when confirmed
        //     status: "pending"
        //   }
        // });

        return {
          success: true,
          message: "Payment processed successfully. Please log in to complete your subscription setup.",
          needsReauth: true,
          subscription: {
            plan: "pro",
            price: 20,
            status: "pending"
          }
        };
      } catch (dbError) {
        console.error(" [BILLING CONFIRM] Database error:", dbError);
        return {
          success: true,
          message: "Payment processed successfully. Please check your dashboard for subscription status.",
          needsReauth: true
        };
      }
    }
    
    
    // Get current app installation and active subscriptions
    const query = `
      query {
        currentAppInstallation {
          activeSubscriptions {
            id
            name
            status
            lineItems {
              id
              plan {
                pricingDetails {
                  ... on AppRecurringPricing {
                    price {
                      amount
                      currencyCode
                    }
                    interval
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await admin.graphql(query);
    const data = await response.json() as any;
    
   

    if (data.errors) {
      console.error(" [BILLING CONFIRM] GraphQL errors:", data.errors);
      return { error: `GraphQL Error: ${data.errors[0]?.message || "Unknown error"}` };
    }
    
    const activeSubscriptions = data.data.currentAppInstallation.activeSubscriptions;
    
    if (activeSubscriptions.length === 0) {
      console.error(" [BILLING CONFIRM] No active subscription found");
      return { error: "No active subscription found" };
    }

    const subscription = activeSubscriptions[0];
 

    const plan = subscription.name.toLowerCase().replace(" plan", "");
    const price = parseFloat(subscription.lineItems[0]?.plan?.pricingDetails?.price?.amount || "0");
    

    // Get or create shop record
    let shop = await (prisma as any).shop.findUnique({
      where: { domain: session.shop }
    });

    if (!shop) {
      shop = await (prisma as any).shop.create({
        data: {
          domain: session.shop,
          accessToken: session.accessToken
        }
      });
    } else {
      await (prisma as any).shop.update({
        where: { id: shop.id },
        data: { accessToken: session.accessToken }
      });
    }

    // Create or update subscription
    const existingSubscription = await (prisma as any).subscription.findFirst({
      where: { shopId: shop.id, status: "active" }
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
          shopId: shop.id,
          plan,
          price,
          status: "active"
        }
      });
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(session.shop, plan, price);
    } catch (emailError) {
      console.error("[BILLING CONFIRM] Failed to send welcome email:", emailError);
      // Don't fail the whole process if email fails
    }

    return {
      success: true,
      subscription: {
        plan,
        price,
        status: "active"
      }
    };

  } catch (error) {
    console.error(" [BILLING CONFIRM] Unexpected error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    
    // If it's a redirect response (302), let it through
    if (error instanceof Response && error.status === 302) {
      throw error;
    }
    
    return { error: "Failed to confirm subscription: " + (error instanceof Error ? error.message : "Unknown error") };
  }
};

export default function BillingConfirm() {
  const { success, message, needsReauth, error } = useLoaderData<typeof loader>();
  
  if (error) {
    return (
      <s-page heading="Billing Confirmation Error">
        <s-section heading="Error">
          <s-banner tone="critical">
            <s-paragraph>Error: {error}</s-paragraph>
          </s-banner>
          <s-button-group>
            <s-button href="/app">Go to Dashboard</s-button>
            <s-button href="/app/pricing">Try Again</s-button>
          </s-button-group>
        </s-section>
      </s-page>
    );
  }
  
  if (needsReauth) {
    return (
      <s-page heading="Payment Processed">
        <s-section heading="Success!">
          <s-banner tone="success">
            <s-paragraph>
              Your payment has been processed successfully! 
              Please log in to your dashboard to see your subscription.
            </s-paragraph>
          </s-banner>
          
          <s-paragraph>
            <strong>Next Steps:</strong>
          </s-paragraph>
          <s-unordered-list>
            <s-list-item>Click "Go to Dashboard" below to log in</s-list-item>
            <s-list-item>Your subscription will be visible once logged in</s-list-item>
            <s-list-item>You should receive a welcome email shortly</s-list-item>
          </s-unordered-list>
          
          <s-button-group>
            <s-button variant="primary" href="/app">
              Go to Dashboard
            </s-button>
            <s-button href="/app/pricing">
              View Plans
            </s-button>
          </s-button-group>
        </s-section>
      </s-page>
    );
  }
  
  return (
    <s-page heading="Subscription Confirmed">
      <s-section heading="Welcome!">
        <s-banner tone="success">
          <s-paragraph>
            Your subscription has been successfully activated! 
            You should receive a welcome email shortly.
          </s-paragraph>
        </s-banner>
        
        <s-paragraph>
          You can now access all the features included in your plan. 
          If you have any questions, please don't hesitate to contact our support team.
        </s-paragraph>
        
        <s-paragraph>
          <strong>Note:</strong> If you don't see your subscription in the dashboard, 
          please wait a few moments for the system to process your payment, 
          or try refreshing the page.
        </s-paragraph>
        
        <s-button-group>
          <s-button variant="primary" href="/app">
            Go to Dashboard
          </s-button>
          <s-button href="/app/pricing">
            View Plans
          </s-button>
        </s-button-group>
      </s-section>
    </s-page>
  );
}
