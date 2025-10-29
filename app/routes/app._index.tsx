import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log(" [DASHBOARD] Loading dashboard data...");
  
  try {
    const { session } = await authenticate.admin(request);
    
    console.log(" [DASHBOARD] Authentication successful");
    console.log(" [DASHBOARD] Session data:", {
      shop: session?.shop,
      accessToken: session?.accessToken ? "***" + session.accessToken.slice(-4) : "none",
      isOnline: session?.isOnline
    });
    
    // Get or create shop record
    console.log(" [DASHBOARD] Looking up shop in database...");
    let shop = await (prisma as any).shop.findUnique({
      where: { domain: session.shop },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    if (!shop) {
      console.log(" [DASHBOARD] Creating new shop record...");
      shop = await (prisma as any).shop.create({
        data: {
          domain: session.shop,
          accessToken: session.accessToken
        }
      });
      console.log(" [DASHBOARD] Shop created:", { id: shop.id, domain: shop.domain });
    } else {
      console.log(" [DASHBOARD] Updating shop access token...");
      await (prisma as any).shop.update({
        where: { id: shop.id },
        data: { accessToken: session.accessToken }
      });
      console.log(" [DASHBOARD] Shop updated:", { id: shop.id, domain: shop.domain });
    }

    // Check for pending subscriptions and activate them
    const pendingSubscription = await (prisma as any).subscription.findFirst({
      where: { 
        shopId: shop.id, 
        status: "pending" 
      },
      orderBy: { createdAt: "desc" }
    });

    if (pendingSubscription) {
      console.log(" [DASHBOARD] Found pending subscription, activating...");
      await (prisma as any).subscription.update({
        where: { id: pendingSubscription.id },
        data: { status: "active" }
      });
      console.log(" [DASHBOARD] Pending subscription activated:", { id: pendingSubscription.id });
    }

    // If no active subscription in database, check Shopify for active subscriptions
    const activeSubscriptions = await (prisma as any).subscription.findMany({
      where: { 
        shopId: shop.id, 
        status: "active" 
      }
    });

    if (activeSubscriptions.length === 0) {
      console.log(" [DASHBOARD] No active subscription in database, checking Shopify...");
      try {
        const { admin } = await authenticate.admin(request);
        
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
        
        if (data.data?.currentAppInstallation?.activeSubscriptions?.length > 0) {
          const shopifySubscription = data.data.currentAppInstallation.activeSubscriptions[0];
          const plan = shopifySubscription.name.toLowerCase().replace(" plan", "");
          const price = parseFloat(shopifySubscription.lineItems[0]?.plan?.pricingDetails?.price?.amount || "0");
          
          console.log(" [DASHBOARD] Found active subscription in Shopify, creating database record...");
          console.log(" [DASHBOARD] Price conversion:", {
            original: shopifySubscription.lineItems[0]?.plan?.pricingDetails?.price?.amount,
            converted: price,
            type: typeof price
          });
          
          const newSubscription = await (prisma as any).subscription.create({
            data: {
              shopId: shop.id,
              plan,
              price,
              status: "active"
            }
          });
          console.log(" [DASHBOARD] Subscription created from Shopify data:", { id: newSubscription.id });
        }
      } catch (error) {
        console.error(" [DASHBOARD] Failed to check Shopify subscriptions:", error);
      }
    }

    // Get updated shop data with active subscriptions
    shop = await (prisma as any).shop.findUnique({
      where: { domain: session.shop },
      include: {
        subscriptions: {
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    console.log(" [DASHBOARD] Shop data retrieved:", {
      shopFound: !!shop,
      domain: shop?.domain,
      subscriptionCount: shop?.subscriptions?.length || 0,
      activeSubscription: shop?.subscriptions?.[0] ? {
        plan: shop.subscriptions[0].plan,
        price: shop.subscriptions[0].price,
        status: shop.subscriptions[0].status
      } : null
    });

    const result = { 
      shop: shop ? {
        domain: shop.domain,
        subscription: shop.subscriptions[0] || null
      } : null
    };
    
    console.log(" [DASHBOARD] Dashboard data loaded successfully");
    return result;
  } catch (error) {
    console.error("[DASHBOARD] Error loading shop data:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    return { shop: null };
  }
};

export default function Index() {
  const { shop } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Dashboard">
      <s-section heading="Welcome to your app">
        <s-paragraph>
          This is your app dashboard. Here you can manage your subscription and access all features.
        </s-paragraph>
        
        {shop?.subscription ? (
          <s-section heading="Current Subscription">
            <s-paragraph>
              <strong>Plan:</strong> {shop.subscription.plan.charAt(0).toUpperCase() + shop.subscription.plan.slice(1)}
            </s-paragraph>
            <s-paragraph>
              <strong>Price:</strong> ${shop.subscription.price}/month
            </s-paragraph>
            <s-paragraph>
              <strong>Status:</strong> {shop.subscription.status.charAt(0).toUpperCase() + shop.subscription.status.slice(1)}
            </s-paragraph>
            <s-paragraph>
              <strong>Shop:</strong> {shop.domain}
            </s-paragraph>
            <s-button-group>
              <s-button variant="primary" href="/app/pricing">
                Change Plan
              </s-button>
              <s-button href="/app/billing/cancel">
                Cancel Subscription
              </s-button>
            </s-button-group>
          </s-section>
        ) : (
          <s-section heading="No Active Subscription">
            <s-paragraph>
              You don't have an active subscription. Choose a plan to get started!
            </s-paragraph>
            <s-button variant="primary" href="/app/pricing">
              View Plans
            </s-button>
          </s-section>
        )}
      </s-section>
    </s-page>
  );
}