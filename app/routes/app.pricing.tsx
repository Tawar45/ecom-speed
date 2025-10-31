import { Form, useActionData, useLoaderData, useLocation, useNavigation, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import createApp from '@shopify/app-bridge';
import { Redirect } from '@shopify/app-bridge/actions';
import { useEffect } from 'react';
import { useFetcher } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin ,session } = await authenticate.admin(request);
  // Query for active subscriptions
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

  try {
    const response = await admin.graphql(query);
    const data = await response.json() as any;
    const activeSubscriptions = data.data?.currentAppInstallation?.activeSubscriptions || [];
    return {
      admin,
      shopifyApiKey: process.env.SHOPIFY_API_KEY,
      activeSubscription: activeSubscriptions.length > 0 ? activeSubscriptions[0] : null,
      shop: session.shop,

    };
  } catch (error) {
    console.error("Error fetching active subscriptions:", error);
    return {
      admin,
      shopifyApiKey: process.env.SHOPIFY_API_KEY,
      activeSubscription: null,
      shop: session.shop,

    };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    const storeName = session.shop.replace('.myshopify.com', '');
    console.log(session,'session');
    const APP_HANDLE = process.env.SHOPIFY_APP_HANDLE || 'ecom-speed-experts-2';
// Build dynamic return URL
   let returnUrl = `https://admin.shopify.com/store/${storeName}/apps/${APP_HANDLE}/app/pricing`;

    const formData = await request.formData();
    const plan = formData.get("plan") as string;
    const price = parseFloat(formData.get("price") as string);
    // Validate form data
    if (!plan || !price || isNaN(price)) {
      console.error("----> [PRICING ACTION] Invalid form data:", { plan, price });
      return { error: "Invalid plan or price data" };
    }
    // Create app subscription using Shopify GraphQL (2025 compliant)
    const mutation = `
      mutation appSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!) {
        appSubscriptionCreate(name: $name, lineItems: $lineItems, returnUrl: $returnUrl, test: true) {
          appSubscription {
            id
            status
            name
          }
          confirmationUrl
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: { amount: price, currencyCode: "USD" },
              interval: "EVERY_30_DAYS"
            }
          }
        }
      ],
      returnUrl: returnUrl
    };

    console.log(" [PRICING ACTION] GraphQL variables-=-=-=-=-=:", variables);
    const response = await admin.graphql(mutation, { variables });
    const data = await response.json() as any;

    console.log(" ----> [PRICING ACTION] GraphQL response:     --=-=-=-=-=-", data);
    if (data.errors) {
      console.error("❌ [PRICING ACTION] GraphQL errors:", data.errors);
      return { error: `GraphQL Error: ${data.errors[0]?.message || "Unknown error"}` };
    }

    if (data.data.appSubscriptionCreate.userErrors.length > 0) {
      console.error("❌ [PRICING ACTION] User errors:", data.data.appSubscriptionCreate.userErrors);
      return { error: data.data.appSubscriptionCreate.userErrors[0].message };
    }

    const confirmationUrl = data.data.appSubscriptionCreate.confirmationUrl;
    if (!confirmationUrl) {
      console.error("❌ [PRICING ACTION] No confirmation URL received");
      return { error: "No confirmation URL received from Shopify" };
    }

    return { confirmationUrl };

  } catch (error) {
    console.error("--- [PRICING ACTION] Unexpected error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    return { error: "Failed to create subscription: " + (error instanceof Error ? error.message : "Unknown error") };
  }
};

export default function PricingPage() {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (fetcher.data?.success) {
      navigate("/app/pricing");
    }
  }, [fetcher.data]);

  console.log("Location in PricingPage:", location);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const chargeId = params.get("charge_id");

    if (chargeId) {
      fetch(`/app/billing/confirm?charge_id=${chargeId}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("Billing Confirm Response:", data);
          if (data.success) {

          } else {
            console.error("Billing confirm failed:", data.error);
          }
        });
    }
  }, [location.search]);


  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const loaderData = useLoaderData<typeof loader>();

  useEffect(() => {
    const storeName = loaderData.shop.replace('.myshopify.com', '');
    if(actionData?.confirmationUrl && loaderData.shopifyApiKey) {
      let  host = btoa('admin.shopify.com/store/'+storeName);
      if (!host) {
        console.error("No host parameter found in URL");
        return;
      }
      const app = createApp({
        apiKey: loaderData.shopifyApiKey,
        host,
      });
      const redirect = Redirect.create(app);
      redirect.dispatch(Redirect.Action.REMOTE, actionData.confirmationUrl);
    }
  }, [actionData?.confirmationUrl, loaderData.shopifyApiKey, location.search]);

  // Extract current active plan
  const activeSubscription = loaderData.activeSubscription;
  let currentPlan: string | null = null;
  if (activeSubscription) {
    // Extract plan name from subscription (e.g., "Basic Plan" -> "basic")
    const subscriptionName = activeSubscription.name?.toLowerCase() || '';
    currentPlan = subscriptionName.replace(' plan', '').trim();
    console.log("Current active plan:", currentPlan);
  }

  const plans = [
    {
      name: "Basic",
      price: 10,
      plan: "basic",
      features: ["Basic features", "Email support", "Standard analytics","Standard analytics"]
    },
    {
      name: "Pro",
      price: 20,
      plan: "pro",
      features: ["All Basic features", "Priority support", "Advanced analytics", "API access"]
    },
    {
      name: "Business",
      price: 30,
      plan: "business",
      features: ["All Pro features", "24/7 support", "Custom integrations", "White-label options"]
    }
  ];

  if (actionData?.confirmationUrl) {
    return (
      <s-page heading="Redirecting to Payment">
        <s-section>
          <s-paragraph>Redirecting to Shopify billing...</s-paragraph>
          <s-paragraph>If you are not redirected automatically, <a href={actionData.confirmationUrl} target="_blank">click here</a>. Or Refresh the page. then try</s-paragraph>
        </s-section>
      </s-page>
    );
  }

  const isActivePlan = (planId: string) => currentPlan === planId;

  return (
    <s-page heading="Choose Your Plan">
      <s-section heading="Pricing Plans">
        {actionData?.error && (
          <s-banner tone="critical">
            <s-paragraph>Error: {actionData.error}</s-paragraph>
          </s-banner>
        )}

        {activeSubscription && (
          <>
            <s-banner tone="success">
              <s-paragraph>
                <strong>Current Plan:</strong> {activeSubscription.name} (${activeSubscription.lineItems?.[0]?.plan?.pricingDetails?.price?.amount}/month)
              </s-paragraph>
            </s-banner>

            <fetcher.Form method="post" action="/app/billing/cancel">
              <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <s-button
                  type="submit"
                  variant="primary"
                  tone="critical"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  Yes, Cancel Subscription
                </s-button>
              </div>
            </fetcher.Form>
          </>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "0.5rem", marginTop: "1rem" }}>
          {plans.map((plan) => {
            const isActive = isActivePlan(plan.plan);
            return (
              <div
                key={plan.plan}
                style={{
                  position: "relative",
                  border: isActive ? "2px solid #008060" : "1px solid #e1e8ed",
                  borderRadius: "8px",
                  padding: "0"
                }}
              >
                <s-section >
                  <div style={{ textAlign: "center" }}>
                    <h2>{plan.name}</h2>
                  </div>
                  <s-paragraph>
                  <div style={{ textAlign: "center" }}>
                    <strong>${plan.price}/month</strong>
                    </div>
                  </s-paragraph>
                  <div style={{ textAlign: "center" }}>
                  <Form method="post">
                    <input type="hidden" name="plan" value={plan.plan} />
                    <input type="hidden" name="price" value={plan.price} />
                    <s-button
                      type="submit"
                      variant={isActive ? "secondary" : "primary"}
                      loading={navigation.state == "submitting"}
                      disabled={navigation.state == "submitting" || isActive}>
                      {isActive ? "Current Plan" : `Subscribe to ${plan.name}`}
                    </s-button>
                  </Form>
                  </div>
                  <s-unordered-list>
                    {plan.features.map((feature, index) => (
                      <s-list-item key={index}>{feature}</s-list-item>
                    ))}
                  </s-unordered-list>
                </s-section>
              </div>
            );
          })}
        </div>

        
      </s-section>
    </s-page>
  );
}