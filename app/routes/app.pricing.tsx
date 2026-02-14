import { Form, useActionData, useLoaderData, useLocation, useNavigation, useNavigate } from "react-router";
// app/routes/app.pricing.tsx
import { plans } from "../data/plans";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import createApp from '@shopify/app-bridge';
import { Redirect } from '@shopify/app-bridge/actions';
import { useEffect, useState, useRef } from 'react';
import { useFetcher } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const chargeId = url.searchParams.get("charge_id");
  const host = url.searchParams.get("host");
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
          void sendWelcomeEmail(shopDomain, planName, Number(amount), recivederEmail).catch(
            (emailErr) => {
              console.error("[PRICING LOADER] Failed to send welcome email:", emailErr);
            }
          );
        } catch (emailErr) {
          console.error("[PRICING LOADER] Failed to send welcome email:", emailErr);
        }
      } 

      // Keep local DB subscription in sync from a fully authenticated server request.
      try {
        const plan = (activeSubscription.name ?? "")
          .toString()
          .toLowerCase()
          .replace(" plan", "")
          .trim();
        const price = Number(
          activeSubscription.lineItems?.[0]?.plan?.pricingDetails?.price?.amount ?? 0
        );
        const recipientEmail = data?.data?.shop?.email ?? null;

        let shop = await (prisma as any).shop.findUnique({
          where: { domain: session.shop },
        });

        if (!shop) {
          shop = await (prisma as any).shop.create({
            data: {
              domain: session.shop,
              accessToken: session.accessToken,
            },
          });
        } else {
          await (prisma as any).shop.update({
            where: { id: shop.id },
            data: { accessToken: session.accessToken },
          });
        }

        const existingActive = await (prisma as any).subscription.findFirst({
          where: { shopId: shop.id, status: "active" },
          orderBy: { createdAt: "desc" },
        });

        if (existingActive) {
          try {
            await (prisma as any).subscription.update({
              where: { id: existingActive.id },
              data: { plan, price, status: "active", email: recipientEmail },
            });
          } catch (updateErr) {
            const msg = updateErr instanceof Error ? updateErr.message : "";
            if (!msg.includes("Unknown argument `email`")) throw updateErr;
            await (prisma as any).subscription.update({
              where: { id: existingActive.id },
              data: { plan, price, status: "active" },
            });
          }
        } else {
          try {
            await (prisma as any).subscription.create({
              data: {
                shopId: shop.id,
                plan,
                price,
                status: "active",
                email: recipientEmail,
              },
            });
          } catch (createErr) {
            const msg = createErr instanceof Error ? createErr.message : "";
            if (!msg.includes("Unknown argument `email`")) throw createErr;
            await (prisma as any).subscription.create({
              data: {
                shopId: shop.id,
                plan,
                price,
                status: "active",
              },
            });
          }
        }
      } catch (dbSyncError) {
        console.error("[PRICING LOADER] Failed to sync subscription in DB:", dbSyncError);
      }
    }

    return {
      host,
      shopifyApiKey: process.env.SHOPIFY_API_KEY,
      activeSubscription: activeSubscriptions.length > 0 ? activeSubscriptions[0] : null,
      shop: session.shop,
    };
  } catch (error) {
    console.error("Error fetching active subscriptions:", error);
    return {
      host,
      shopifyApiKey: process.env.SHOPIFY_API_KEY,
      activeSubscription: null,
      shop: null,
    };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    const storeName = session.shop.replace('.myshopify.com', '');
    const APP_HANDLE =
      process.env.VITE_SHOPIFY_APP_HANDLE ||
      process.env.SHOPIFY_APP_HANDLE ||
      "ecom-speed-experts-2";
    // Build dynamic return URL
    let returnUrl = `https://admin.shopify.com/store/${storeName}/apps/${APP_HANDLE}/app/pricing`;
    const formData = await request.formData();
    const rawPlan = (formData.get("plan") as string | null)?.trim();
    const rawPrice = formData.get("price") as string | null;
    const price = rawPrice === null ? NaN : parseFloat(rawPrice);
    if (!rawPlan || Number.isNaN(price) || price < 0) {
      console.error("----> [PRICING ACTION] Invalid form data:", { plan: rawPlan, price });
      return { error: "Invalid plan or price data" };
    }
    const planId = rawPlan.toLowerCase();
    const planNames: Record<string, string> = {
      basic: "Basic Plan",
      expert: "Expert Plan",
      yearly: "Yearly Plan",
    };

    if (price === 0) {
      return { success: true, message: "Free plan is active. No billing required." };
    }
    // Create app subscription using Shopify GraphQL (2025 compliant) //test: true
    const mutation = `
      mutation appSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!) {
        appSubscriptionCreate(name: $name, lineItems: $lineItems, returnUrl: $returnUrl,test: true) {
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
      name: planNames[planId] ?? `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
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
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`Billing confirm failed with status ${res.status}`);
          }
          return res.json();
        })
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

  const handleCancelClick = () => {
    setShowConfirm(true);
  };
  // Confirm cancellation and submit
  const handleConfirmCancel = () => {
    setShowConfirm(false);
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      formData.set("confirmCancel", "true");
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
    if (actionData?.confirmationUrl && loaderData.shopifyApiKey && loaderData.shop) {
      if (loaderData.host) {
        const app = createApp({
          apiKey: loaderData.shopifyApiKey,
          host: loaderData.host,
        });
        const redirect = Redirect.create(app);
        redirect.dispatch(Redirect.Action.REMOTE, actionData.confirmationUrl);
        return;
      }

      // Fallback for rare cases where host is missing after navigation.
      if (typeof window !== "undefined") {
        if (window.top) {
          window.top.location.href = actionData.confirmationUrl;
        } else {
          window.location.href = actionData.confirmationUrl;
        }
      }
    }
  }, [actionData?.confirmationUrl, loaderData.shopifyApiKey, loaderData.shop, loaderData.host]);
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
      <s-section>
        <h2 style={{ fontSize: "28px", fontWeight: "600", marginBottom: "16px" }}>
          Plans
        </h2>
        {/* Error Banner */}
        {actionData?.error && (
          <s-banner tone="critical">
            <s-paragraph>Error: {actionData.error}</s-paragraph>
          </s-banner>
        )}

        {/* Current Plan Banner with Cancel Button */}
        {activeSubscription && (
          <div style={{ border: '1px solid #b2dff8', background: '#eaf6ff', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
            <s-banner >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div style={{ margin: 0, fontSize: '16px', color: '#03549a' }}>
                  <s-paragraph>
                    <strong>Current Plan:</strong> {activeSubscription.name} (
                    ${activeSubscription.lineItems?.[0]?.plan?.pricingDetails?.price?.amount}/month)
                  </s-paragraph>
                </div>

                <fetcher.Form method="post" action="/app/billing/cancel" ref={formRef}>
                  <s-button type="button" variant="primary" tone="critical" loading={isSubmitting} disabled={isSubmitting} onClick={handleCancelClick}>
                    Cancel Subscription
                  </s-button>
                </fetcher.Form>
              </div>
            </s-banner>
          </div>
        )}

        {/* Confirmation Popup */}
        {showConfirm && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(4px)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "32px",
                width: "90%",
                maxWidth: "450px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#202223' }}>Confirm Cancellation</h3>
                <button onClick={handleClosePopup} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6d7175', padding: 0, lineHeight: 1 }}>✖</button>
              </div>
              <p style={{ margin: 0, fontSize: '16px', color: '#6d7175' }}>Are you sure you want to cancel your subscription? You will lose access to all premium features at the end of your billing period.</p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                <s-button onClick={handleClosePopup}>No, Go Back</s-button>
                <s-button
                  onClick={handleConfirmCancel}
                  variant="primary"
                  tone="critical"
                  loading={isSubmitting}
                >
                  {isSubmitting ? "Cancelling..." : "Yes, Cancel"}
                </s-button>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Plan Cards */}
        <div
          className="pricing-grid"
          style={{
            display: "grid",
            gap: "24px",
            marginTop: "2rem",
            // Default for mobile is 1 column
            gridTemplateColumns: "1fr",
          }}
        >
          {plans.map((plan, index) => {
            const isActive = isActivePlan(plan.plan);
            const isSubmittingThisPlan = navigation.state === "submitting" && loadingPlan === plan.plan;

            // Define plan types based on index
            const isFree = index === 0;
            const isPopular = index === 1;
            const isRecommended = index === 2;

            return (
              <div
                key={plan.plan}
                className="pricing-card"
                style={{
                  position: "relative",
                  backgroundColor: "#fff",
                  border: isRecommended ? "2px solid #008060" : "1px solid #e1e3e5",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                  padding: isRecommended ? "40px 24px" : "32px 24px",
                  // Ensures the card fills its grid cell and includes padding/border in its width
                  boxSizing: "border-box",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Plan Badge */}
                {isPopular && !isActive && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: "#059669",
                      color: "#fff",
                      padding: "4px 16px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    POPULAR
                  </div>
                )}
                {isRecommended && !isActive && (
                  <div style={{
                    position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#008060", color: "#fff",
                    padding: "4px 16px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                  >
                    RECOMMENDED
                  </div>
                )}

                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#202223", letterSpacing: "-0.5px", margin: '0 0 8px 0' }}>
                    {plan.name}
                  </h2>
                  {isFree ? (
                    <div style={{ fontSize: "2rem", fontWeight: "700", color: "#202223", marginTop: "20px" }}>
                      Free
                    </div>
                  ) : (
                    <div style={{ fontSize: "2rem", fontWeight: "700", color: "#202223", marginTop: "20px" }}>
                      ${plan.price}
                      <span style={{ fontSize: "1rem", color: "#6d7175", fontWeight: "400" }}>/month</span>
                    </div>
                  )}
                </div>

                {/* Big Save Tag for Recommended Plan */}
                {isRecommended && (
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: '16px', fontSize: '13px', fontWeight: '600' }}>
                      💰 Big Save
                    </span>
                  </div>
                )}

                {/* Subscribe Button */}
                <Form method="post" onSubmit={() => setLoadingPlan(plan.plan)} style={{ marginBottom: '24px', textAlign: 'center' }}>
                  <input type="hidden" name="plan" value={plan.plan} />
                  <input type="hidden" name="price" value={plan.price} />
                  <s-button
                    type="submit"
                    variant={isActive ? "auto" : (isFree ? "secondary" : "primary")}
                    loading={isSubmittingThisPlan}
                    disabled={isSubmittingThisPlan || isActive}
                  >
                    {isActive ? "Current Plan" : (isFree ? "Get Started" : `Subscribe to ${plan.name}`)}
                  </s-button>
                </Form>

                {/* Features List */}
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    flexGrow: 1,
                  }}
                >
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '12px',
                        fontSize: '14px',
                        color: '#42474c',
                        wordBreak: 'break-word',
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        style={{ marginRight: '12px', flexShrink: 0 }}
                      >
                        <circle cx="8" cy="8" r="8" fill="#008060" />
                        <path
                          d="M4 8L7 11L12 5"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

              </div>
            );
          })}
        </div>

        {/* Responsive Design & Grid Styles */}
        <style>{`
      /* For screens wider than 768px (Desktop): 3 columns */
      @media (min-width: 769px) {
        .pricing-grid {
          grid-template-columns: repeat(3, 1fr) !important;
        }
      }
      
      @media (max-width: 768px) {
        .pricing-card {
          padding: 24px 16px !important;
        }
        h2 {
          font-size: 1.25rem !important;
        }
      }
    `}</style>
      </s-section>
    </s-page>
  );
}
