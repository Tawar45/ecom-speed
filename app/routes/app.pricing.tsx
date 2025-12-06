import { Form, useActionData, useLoaderData, useLocation, useNavigation, useNavigate } from "react-router";
// app/routes/app.pricing.tsx
import { plans } from "../data/plans";
import { authenticate } from "../shopify.server";
import createApp from '@shopify/app-bridge';
import { Redirect } from '@shopify/app-bridge/actions';
import { useEffect, useState , useRef } from 'react';
import { useFetcher } from "react-router";
import { sendWelcomeEmail } from "../utils/email.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const chargeId = url.searchParams.get("charge_id");
console.log(chargeId,'--------------------chargeId in pricing loader');
  const combinedQuery = `
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
    const response = await admin.graphql(combinedQuery);
    const data = await response.json() as any;
    const activeSubscriptions = data.data?.currentAppInstallation?.activeSubscriptions || [];
      // If there's an active subscription, inspect its status and optionally send a welcome email.
    const activeSubscription = activeSubscriptions.length > 0 ? activeSubscriptions[0] : null;
    if (activeSubscription) {
     // Normalize status (Shopify may use 'ACTIVE', 'active', 'accepted', etc.)
      const status = (activeSubscription.status ?? "").toString().toLowerCase();
     // Decide which statuses you consider successful/final for sending welcome email
      const successStatuses = ["active", "accepted", "paid", "success"];

      if (successStatuses.includes(status) && chargeId) {
        try {
          // dynamic import so this module stays server-only
          const { sendWelcomeEmail } = await import("../utils/email.server");
          // Compose email fields
          const shopDomain = session.shop; // e.g. "example-store.myshopify.com"
          const planName = activeSubscription.name ?? "Your Plan";
          const recivederEmail = data?.data?.shop.email
          // Try to find a price/amount if present
          let amount = 0;
          try {
            const lineItem = activeSubscription.lineItems?.[0];
            amount = lineItem?.plan?.pricingDetails?.price?.amount ?? 0;
          } catch (_) {
            amount = 0;
          }
          const recipient = process.env.EMAIL_SUPPORT_TO; // fallback; replace with real recipient logic
          await sendWelcomeEmail(shopDomain, planName, Number(amount), recivederEmail);
        } catch (emailErr) {
          console.error("[PRICING LOADER] Failed to send welcome email:", emailErr);
        }
      } else {
        console.log(`[PRICING LOADER] Subscription found but status="${activeSubscription.status}" — skipping welcome email.`);
      }
    }

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
    const APP_HANDLE = process.env.VITE_SHOPIFY_APP_HANDLE || 'ecom-page-speed-expert';
     // Build dynamic return URL
    let returnUrl = `https://admin.shopify.com/store/${storeName}/apps/${APP_HANDLE}/app/pricing`;
    console.log("----> [PRICING ACTION] Return URL:", returnUrl);
    const formData = await request.formData();
    const plan = formData.get("plan") as string;
    const price = parseFloat(formData.get("price") as string);    // Validate form data
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
    const response = await admin.graphql(mutation, { variables });
    const data = await response.json() as any;

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
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (fetcher.data?.success) {
      navigate("/app/pricing");
    }
  }, [fetcher.data, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const chargeId = params.get("charge_id");
    if (chargeId) {
      fetch(`/app/billing/confirm?charge_id=${chargeId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const newUrl = location.pathname;
            window.history.replaceState({}, "", newUrl);
          //  sendWelcomeEmail('export-dev.myshopify.com','basic plan',10); 
          }
        })
        .catch((error) => {
          console.error("Error sending welcome email:", error);
        });
    }
  }, [location.search]);

  const handleCancelClick = (event: any) => {
    event.preventDefault(); // Prevent form auto-submit
    setShowConfirm(true);
  };
  // Confirm cancellation and submit
  const handleConfirmCancel = () => {
    setShowConfirm(false);
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      fetcher.submit(formData, {
        method: "post",
        action: "/app/billing/cancel",
      });
    }
  };

  // Close popup
  const handleClosePopup = () => {
    setShowConfirm(false);
  };

  
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const loaderData = useLoaderData<typeof loader>();

  useEffect(() => {
    const storeName = loaderData.shop?.replace('.myshopify.com', '');
    if (actionData?.confirmationUrl && loaderData.shopifyApiKey) {
      // Get host from URL search params
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
    const subscriptionName = activeSubscription.name?.toLowerCase() || '';
    currentPlan = subscriptionName.replace(' plan', '').trim();
  }

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
      {/* Error Banner */}
      {actionData?.error && (
        <s-banner tone="critical">
          <s-paragraph>Error: {actionData.error}</s-paragraph>
        </s-banner>
      )}

      {/* Current Plan Banner with Cancel Button (side by side) */}
      {activeSubscription && (
        <s-banner >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
              background: "none"
              
            }}
          >
            <s-paragraph>
              <div style={{background:"none"}}>
              <strong>Current Plan:</strong> {activeSubscription.name} (
              ${activeSubscription.lineItems?.[0]?.plan?.pricingDetails?.price?.amount}/month)
              </div>
            </s-paragraph>

            <fetcher.Form method="post" action="/app/billing/cancel" ref={formRef}>
              <s-button type="button" variant="primary" tone="critical" loading={isSubmitting} disabled={isSubmitting}
                onClick={handleCancelClick}>
                Yes, Cancel Subscription
              </s-button>
          </fetcher.Form>

      {/* Confirmation Popup */}
      {showConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "8px",
              padding: "20px",
              width: "400px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            }}
          >
            <h3>Confirm Cancellation</h3>
            <p>Are you sure you want to cancel your subscription?</p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button onClick={handleClosePopup} style={{cursor: "pointer"}}>No, Go Back</button>
              <button
                onClick={handleConfirmCancel}
                style={{
                  background: "#c53030",
                  color: "white",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                {isSubmitting ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
          </div>
        </s-banner>
      )}
      {/* Pricing Plan Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",gap: "0.5rem",marginTop: "1rem",}}>
        {plans.map((plan) => {
          const isActive = isActivePlan(plan.plan);

          const isSubmittingThisPlan = navigation.state === "submitting" && loadingPlan === plan.plan;
          return (
            <div key={plan.plan} style={{ position: "relative",backgroundColor: "#fff",
                border: isActive? "2px solid #ddd": "1px solid #ddd",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                paddingLeft: "15px",
                width:"250px",
                height:"300px",
              }}
            >
              <s-section>
                <div style={{ textAlign: "center" }}>
                  <h2 style={{ fontSize: "1rem", fontWeight: "600",color: "#333",letterSpacing: "0.5px",}}>
                    {plan.name}
                  </h2>
                </div>

                {/* Price */}
                <s-paragraph>
                  <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                    <strong style={{ fontSize: "2rem", fontWeight: "700",}}>
                      ${plan.price}
                    </strong>
                    <span style={{fontSize: "0.9rem",color: "#666",marginLeft: "2px",}}>
                      /mo
                    </span>
                  </div>
                </s-paragraph>
                {/* Subscribe Button */}
                <div style={{ textAlign: "center", marginBottom: "1.2rem" }}>
                  <Form method="post" onSubmit={() => setLoadingPlan(plan.plan)} >
                    <input type="hidden" name="plan" value={plan.plan} />
                    <input type="hidden" name="price" value={plan.price} />
                    <s-button
                    type="submit"
                    variant={isActive ? "secondary" : "primary"}
                    loading={isSubmittingThisPlan}
                    disabled={isSubmittingThisPlan || isActive}>
                    {isActive ? "Current Plan" : `Subscribe to ${plan.name}`}
                  </s-button>
                  </Form>
                </div>
                <s-unordered-list>
                  {plan.features.map((feature, index) => (
                    <s-list-item key={index}>
                      <div
                        style={{
                          backgroundColor:"#F5F5F5",
                          borderRadius: "8px",
                          marginTop: "0.4rem",
                          textAlign: "left",
                          padding:"8px 12px",
                        }}
                      >
                        {feature}
                      </div>
                    </s-list-item>
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