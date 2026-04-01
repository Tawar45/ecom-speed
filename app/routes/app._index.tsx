import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { sendWelcomeEmailInstalledMaill } from "../utils/email.server";
import { useEffect, useState ,useRef  } from "react";
import { handleShopSession } from "../utils/email.server";
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const appEmbedConfig = {
    apiKey: process.env.SHOPIFY_API_KEY || null,
    handle:
      process.env.SHOPIFY_THEME_APP_EMBED_HANDLE ||
      process.env.VITE_SHOPIFY_THEME_APP_EMBED_HANDLE ||
      "ecom_expert_speed",
  };

  try {
    const { session, admin } = await authenticate.admin(request);

    // this function will create or update the shop record as needed and send welcome email
    let shop = await handleShopSession(prisma, session, admin);

    if (!shop || !shop.id) {
      console.warn("[DASHBOARD] Shop not found after handleShopSession");
      return { shop: null, appEmbedConfig };
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
      await (prisma as any).subscription.update({
        where: { id: pendingSubscription.id },
        data: { status: "active" }
      });
    }

    // If no active subscription in database, check Shopify for active subscriptions
    const activeSubscriptions = await (prisma as any).subscription.findMany({
      where: {
        shopId: shop.id,
        status: "active"
      }
    });

    if (activeSubscriptions.length === 0) {
      try {
        // const { admin } = await authenticate.admin(request);

        const query = `
          query {
            shop {
              id
              name
              email
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

        const response = await admin.graphql(query);
        const data = await response.json() as any;
        const recivederEmail = data?.data?.shop.email
        if (data.data?.currentAppInstallation?.activeSubscriptions?.length > 0) {
          const shopifySubscription = data.data.currentAppInstallation.activeSubscriptions[0];
          const plan = shopifySubscription.name.toLowerCase().replace(" plan", "");
          const price = parseFloat(shopifySubscription.lineItems[0]?.plan?.pricingDetails?.price?.amount || "0");

        

          const newSubscription = await (prisma as any).subscription.create({
            data: {
              shopId: shop.id,
              plan,
              price,
              status: "active",
              email: recivederEmail
            }
          });
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

    const result = {
      shop: shop ? {
        domain: shop.domain,
        subscription: (shop as any)?.subscriptions[0] || null
      } : null,
      appEmbedConfig,
    };

    return result;
  } catch (error) {
    console.error("[DASHBOARD] Error loading shop data:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    return { shop: null, appEmbedConfig };
  }
};

function extractEmbededAppId(typeString: string | null): string | null {
  if (!typeString || typeof typeString !== "string") return null;
  const parts = typeString.split("/");
  return parts[parts.length - 1] || null;
}

function extractBlockType(typeString: string | null): string | null {
  if (!typeString || typeof typeString !== "string") return null;
  const parts = typeString.split("/");
  return parts.length >= 2 ? parts[parts.length - 2] : null;
}

function getFirstKey(obj: any) {
  if (!obj || typeof obj !== "object") return "";
  return Object.keys(obj)[0] || "";
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const shop = data?.shop ?? null;
  const appEmbedConfig = data?.appEmbedConfig ?? null;

  // Show a proper error/empty state instead of blank page (fixes review: stuck loading, 2.1.1)
  if (!shop) {
    return (
      <s-page heading="Dashboard">
        <s-section>
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          >
            <p style={{ fontSize: "16px", color: "#374151", marginBottom: "12px" }}>
              Unable to load your dashboard. This can happen if the session expired or data is still syncing.
            </p>
            <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>
              Please refresh the page or reopen the app from your Shopify admin.
            </p>
            <button
              type="button"
              onClick={() => typeof window !== "undefined" && window.location.reload()}
              style={{
                padding: "10px 20px",
                backgroundColor: "#059669",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Reload app
            </button>
          </div>
        </s-section>
      </s-page>
    );
  }
  const [themeId, setThemeId] = useState<string | null>(null);
  const [embededApp, setEmbededApp] = useState<any>();
  const [extensionId, setExtensionId] = useState<any>();
  const [embededAppName, setEmbededAppName] = useState<string | null>();
  const [themes, setThemes] = useState<any[]>([]);
  const [loadingThemes, setLoadingThemes] = useState(true);
  const [themeError, setThemeError] = useState<string | null>(null);
  const logoUrl = "../../logo.png";
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  useEffect(() => {
    const fetchThemeData = async () => {
      try {
        const res = await fetch(`/app/theme-extension-data`);
        const data = await res.json();

        // embedEnabled in your loader is an array (or null). Normalize to a single item.
        const embedItem = Array.isArray(data.embedEnabled)
          ? data.embedEnabled[0]
          : data.embedEnabled;
        if (data.success) {
          setThemes(data.themes || []);
          if (embedItem && embedItem.type && typeof embedItem.settings === "object") {
            const value = !embedItem.disabled

            // if value is boolean -> set state, else null
            if (typeof value === "boolean") {
              setEmbededApp(value);
            } else {
              // If not boolean, treat as off (or unknown). Here we set false if falsy, null if undefined.
              setEmbededApp(value === undefined ? null : Boolean(value));
            }

            // set extension/type metadata for open settings link
            if (embedItem.type) {
              const nextExtensionId = extractEmbededAppId(embedItem.type);
              const nextEmbededAppName = extractBlockType(embedItem.type);

              setExtensionId(nextExtensionId);
              setEmbededAppName(nextEmbededAppName);
            } else {
              setExtensionId(null);
              setEmbededAppName(null);
            }
          } else {
            // No embed item/settings found -> treat as Off (false)
            setEmbededApp(false);
            setExtensionId(null);
            setEmbededAppName(null);
          }
          if (data.themes?.length > 0) {
            const main = data.themes.find((t: any) => t.role === "MAIN");
            if (main) setThemeId(main.id.split("/").pop());
          }
        } else {
          console.error(" Failed to fetch theme toggle data:", data);
        }
      } catch (error) {
        console.error(" Error fetching theme toggle data:", error);
        setThemeError("Failed to load theme settings. Please refresh the page.");
      } finally {
        setLoadingThemes(false);
      }
    };
    fetchThemeData(); //  run the async function 
  }, []);

  const openEmbedSettings = () => {
    if (!shop?.domain) {
      console.error("[dashboard] missing shop domain to open embed settings", {
        themeId,
        shopDomain: shop?.domain,
        embededAppName,
        extensionId,
        appEmbedConfig,
      });
      return;
    }

    const activateAppId = extensionId && embededAppName
      ? `${extensionId}/${embededAppName}`
      : appEmbedConfig?.apiKey && appEmbedConfig?.handle
        ? `${appEmbedConfig.apiKey}/${appEmbedConfig.handle}`
        : null;

    const url = activateAppId
      ? `https://${shop.domain}/admin/themes/current/editor?context=apps&activateAppId=${activateAppId}`
      : `https://${shop.domain}/admin/themes/current/editor?context=apps`;
    window.open(url, "_blank");
  };

  const handleClick = () => {
    if (isSpinning) return; // prevent double-click

    setIsSpinning(true);

    // stop spinning after 3 seconds
    setTimeout(() => {
      setIsSpinning(false);
    }, 3000);
  };

  return (
    <>
      <s-page heading="Dashboard">
        


<s-section>
  {/* 
    Welcome Promo Bar
    - Features a larger logo for better brand visibility.
    - Messaging is changed to a friendly, welcoming tone.
    - The layout is adjusted to accommodate the new content.
  */}
  <div
    style={{
    
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div
        style={{
          width: 110, // Increased logo container size
          height: 110,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <img src={logoUrl} alt="app" style={{ width: 90, height: 90, objectFit: "contain" }} /> {/* Increased logo size */}
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 18, color: "#202223", lineHeight: 1.4 }}>
          Welcome to Page Speed Expert
        </div>
        <div style={{ fontSize: 15, color: "#6d7175", marginTop: 4, lineHeight: 1.5 }}>
          We're excited to have you. Skyrocket your Shopify store’s performance without compromising design or features.
        </div>
      </div>
    </div>
  </div>
</s-section>


<s-section>
    <div style={{ display: "block", gap: 16, fontFamily: "Inter, system-ui, sans-serif", backgroundColor: "#f9fafb", padding: "16px" }}>
        {/* Error message */}
        {themeError && (
            <div
                style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "16px",
                    color: "#dc2626",
                    fontSize: "14px",
                    fontWeight: 500,
                }}
            >
                {themeError}
            </div>
        )}

        {/* Extension setting */}
        <div
            style={{
                border: "1px solid #e1e3e5",
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontFamily: "Inter, sans-serif",
                backgroundColor: "#fff",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", background: "#f3f4f6", borderRadius: "8px" }}>
                    <span style={{ fontSize: "20px" }}>🧩</span>
                </div>
                <div>
                    <span style={{ fontWeight: 600, fontSize: "16px", color: "#202223" }}>Theme store app embed</span>
                    <div
                        style={{
                            marginTop: "4px",
                            backgroundColor: embededApp ? "#ecfdf3" : "#f3f4f6",
                            color: embededApp ? "#059669" : "#6d7175",
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            fontSize: "12px",
                            fontWeight: 600,
                            display: "inline-block",
                        }}
                    >
                        {embededApp ? "Enabled" : "Disabled"}
                    </div>
                </div>
            </div>

            <button
                onClick={openEmbedSettings}
                style={{
                    backgroundColor: "#fff",
                    border: "1px solid #c7c7c7",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#202223",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = "#f3f4f6"; (e.target as HTMLElement).style.borderColor = "#a1a1a1"; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = "#fff"; (e.target as HTMLElement).style.borderColor = "#c7c7c7"; }}
            >
                App embed settings
            </button>
        </div>

        {/* Two columns */}
        <div style={{ display: "flex", gap: 16, marginTop: "16px" }}>
            {/* Web performance */}
            <div
                style={{
                    flex: 1,
                    background: "#fff",
                    border: "1px solid #e1e3e5",
                    borderRadius: 8,
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                }}
            >
                <div>
                    <div style={{ fontWeight: 600, fontSize: "16px", marginBottom: 12, color: "#202223" }}>Web performance</div>
                    <div style={{ fontSize: "14px", color: "#6d7175", marginBottom: "20px" }}>Analyze your store's speed score and identify areas for improvement.</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                    {/* Circle area */}
                    <div
                        onClick={handleClick}
                        style={{
                            width: 160,
                            height: 160,
                            borderRadius: "50%",
                            background: "#f9fafb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            border: "6px solid #e5e7eb",
                            transition: "border-color 0.2s ease",
                        }}
                        onMouseEnter={(e) => (e.target as HTMLElement).style.borderColor = "#c7c7c7"}
                        onMouseLeave={(e) => (e.target as HTMLElement).style.borderColor = "#e5e7eb"}
                    >
                        <div
                            style={{
                                width: 90,
                                height: 90,
                                borderRadius: "50%",
                                border: "8px solid #e5e7eb",
                                borderTopColor: "#059669",
                                animation: isSpinning ? "spin 1s linear infinite" : "none",
                            }}
                        />
                        <style>
                            {`
                            @keyframes spin {
                                to { transform: rotate(360deg); }
                            }
                            `}
                        </style>
                    </div>
                    <button onClick={handleClick} style={{ background: "none", border: "none", color: "#059669", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                        {isSpinning ? 'Analyzing...' : 'Analyze Performance'}
                    </button>
                </div>

                <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: "13px", color: "#6d7175", marginTop: "20px", justifyContent: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                        0-49 (Poor)
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
                        50-84 (Needs Improvement)
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#059669", display: "inline-block" }} />
                        85-100 (Good)
                    </span>
                </div>
            </div>

            {/* Site speed */}
            <div style={{ flex: 1, background: "#fff", border: "1px solid #e1e3e5", borderRadius: 8, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
                <div style={{ fontWeight: 600, fontSize: "16px", marginBottom: 12, color: "#202223" }}>Site Speed Up</div>
                <img src={embededApp ? '../../speed_on.png' : '../../speed_off.png'} alt="rocket" style={{ width: 220, height: 160, objectFit: "contain", opacity: 0.95 }} />
                <div style={{ marginTop: 12, background: embededApp ? "#ecfdf3" : "#f3f4f6", color: embededApp ? "#059669" : "#6d7175", fontSize: "12px", padding: "4px 12px", borderRadius: 12, display: "inline-block", fontWeight: 600, }}>{embededApp ? "Active" : "Inactive"}</div>
                {embededApp ? (
                    <>
                        <div style={{ marginTop: 16, fontSize: "14px", color: "#202223", textAlign: "center", fontWeight: 500 }}>
                            🎉 Your store is optimized for speed!
                        </div>
                        <div style={{ marginTop: 4, fontSize: "13px", color: "#6d7175", textAlign: "center" }}>
                            Prefetching is active to improve user experience.
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ marginTop: 16, fontSize: "14px", color: "#202223", textAlign: "center", fontWeight: 500 }}>
                            Enable the app embed to speed up your store.
                        </div>
                        <div style={{ marginTop: 4, fontSize: "13px", color: "#6d7175", textAlign: "center" }}>
                            Get a faster, more responsive site in just one click.
                        </div>
                    </>
                )}
                <button
                    onClick={() => openEmbedSettings()}
                    style={{
                        marginTop: 16,
                        background: embededApp ? "#fbbf24" : "#059669",
                        color: "#fff",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: 600,
                        transition: "background-color 0.2s ease",
                    }}
                    type="button"
                    onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = embededApp ? "#f59e0b" : "#047857"}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = embededApp ? "#fbbf24" : "#059669"}
                >
                    ⚡ {embededApp ? 'Manage Settings' : 'Speed Up My Store'}
                </button>
            </div>
        </div>

     
    
        {/* NEW: "Feel the Difference" Section */}
        <div style={{ background: "#fff", border: "1px solid #e1e3e5", borderRadius: 8, padding: "24px", marginTop: "16px", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
            <div style={{ fontWeight: 700, fontSize: "18px", color: "#202223", textAlign: "center", marginBottom: 8 }}>Feel the Difference in Every Click</div>
            <div style={{ fontSize: "14px", color: "#6d7175", textAlign: "center", marginBottom: "24px" }}>Speed Expert uses intelligent prefetching to make your store feel faster. Notice the change in user experience.</div>
            
            <div style={{ display: "flex", gap: "24px", alignItems: "stretch", justifyContent: "center" }}>
                {/* Before */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "20px", border: "1px solid #e1e3e5", borderRadius: "8px", background: "#f9fafb" }}>
                    <div style={{ fontWeight: 600, marginBottom: "16px", color: "#374151", fontSize: "16px" }}>Without Speed Expert</div>
                    <div style={{ width: 50, height: 50, marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {/* Simple Loading Spinner Icon */}
                        <svg width="40" height="40" viewBox="0 0 50 50" style={{ animation: "spin 1.5s linear infinite" }}>
                            <circle cx="25" cy="25" r="20" fill="none" stroke="#e5e7eb" strokeWidth="4"/>
                            <path d="M25 5 A 20 20 0 0 1 45 25" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round"/>
                        </svg>
                    </div>
                    <div style={{ fontSize: "14px", color: "#6d7175", fontWeight: 500, marginBottom: 8 }}>Waiting for pages to load...</div>
                    <div style={{ fontSize: "13px", color: "#9ca3af" }}>Customers experience noticeable delays, which can hurt engagement and increase bounce rates.</div>
                </div>

                {/* After */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "20px", border: "1px solid #e1e3e5", borderRadius: "8px", background: "#ecfdf3" }}>
                    <div style={{ fontWeight: 600, marginBottom: "16px", color: "#059669", fontSize: "16px" }}>With Speed Expert</div>
                    <div style={{ width: 50, height: 50, marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {/* Checkmark Icon */}
                        <svg width="40" height="40" viewBox="0 0 50 50" fill="none">
                            <circle cx="25" cy="25" r="20" fill="#dcfce7"/>
                            <path d="M16 25L22 31L34 19" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <div style={{ fontSize: "14px", color: "#059669", fontWeight: 500, marginBottom: 8 }}>Pages are ready instantly</div>
                    <div style={{ fontSize: "13px", color: "#047857" }}>Navigation feels seamless and instantaneous, creating a delightful shopping experience.</div>
                </div>
            </div>
        </div>

        {/* Add the spin animation keyframes if not already present */}
        <style>{`
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `}</style>
    

    
        {/* How it works */}
        <div style={{ background: "#fff", border: "1px solid #e1e3e5", borderRadius: 8, padding: 24, display: "flex", gap: 24, alignItems: "center", marginTop: "16px", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "18px", color: "#202223" }}>How does Speed Expert work?</div>
                <div style={{ color: "#6d7175", marginTop: 8, fontSize: "14px", lineHeight: "1.5" }}>
                    Speed Expert significantly improves your store's perceived performance. It works by intelligently preloading pages on hover, lazy loading non-critical resources, and optimizing asset delivery. This creates a faster, smoother browsing experience for your customers, which can lead to increased engagement and sales.
                </div>

                <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                    <button style={{ padding: "10px 16px", borderRadius: 6, border: "1px solid #c7c7c7", background: "#fff", color: "#202223", cursor: "pointer", fontSize: "14px", fontWeight: 500, transition: "all 0.2s ease" }} type="button" onClick={() => setShowVideoModal(true)} onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = "#f3f4f6"; (e.target as HTMLElement).style.borderColor = "#a1a1a1"; }} onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = "#fff"; (e.target as HTMLElement).style.borderColor = "#c7c7c7"; }}>Watch the video</button>
                </div>
            </div>

            {/* Logo is now contained, not cropped */}
            <div style={{ width: 120, height: 80, flexShrink: 0, borderRadius: "8px", border: "1px solid #e1e3e5", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={logoUrl} alt="How it works" style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain" }} />
            </div>
        </div>

        {/* FAQ */}
        <div style={{ background: "#fff", border: "1px solid #e1e3e5", borderRadius: 8, padding: "16px", marginTop: "16px", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
            <div style={{ fontWeight: 700, fontSize: "18px", color: "#202223" }}>Frequently Asked Questions</div>
            
            <style>{`
                .faq-item {
                    border-top: 1px solid #e1e3e5;
                    transition: box-shadow 0.2s ease;
                }
                .faq-item:hover {
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .faq-summary {
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 14px;
                    color: #202223;
                    padding: 16px 0;
                    list-style: none;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: color 0.2s ease;
                }
                .faq-summary:hover {
                    color: #059669;
                }
                .faq-summary::-webkit-details-marker {
                    display: none;
                }
                .faq-icon {
                    transition: transform 0.2s ease;
                    color: #6d7175;
                    flex-shrink: 0;
                    margin-left: 16px;
                }
                details[open] .faq-icon {
                    transform: rotate(180deg);
                }
                .faq-content {
                    color: #6d7175;
                    font-size: 14px;
                    line-height: 1.5;
                    padding-bottom: 16px;
                }
            `}</style>

            <details className="faq-item" style={{ borderTop: "none" }}>
                <summary className="faq-summary">
                    How does this feature work?
                    <svg className="faq-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 4.5L6 7.5L3 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </summary>
                <div className="faq-content">When users hover a link for 65ms or more, the app preloads that page to speed up navigation.</div>
            </details>
            <details className="faq-item">
                <summary className="faq-summary">
                    How does this help my store?
                    <svg className="faq-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 4.5L6 7.5L3 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </summary>
                <div className="faq-content">Faster browsing improves user experience and can increase sales by up to 1% per 100ms saved.</div>
            </details>
            <details className="faq-item">
                <summary className="faq-summary">
                    Why didn’t my speed score change?
                    <svg className="faq-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 4.5L6 7.5L3 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </summary>
                <div className="faq-content">Prefetching speeds up perceived navigation but doesn’t affect initial load metrics in GTmetrix or PageSpeed Insights.</div>
            </details>
            <details className="faq-item">
                <summary className="faq-summary">
                    Is this safe for SEO and analytics?
                    <svg className="faq-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 4.5L6 7.5L3 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </summary>
                <div className="faq-content">Yes, it follows SEO best practices and won’t cause false pageviews or indexing issues.</div>
            </details>
            <details className="faq-item">
                <summary className="faq-summary">
                    Does it work on mobile and slow networks?
                    <svg className="faq-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 4.5L6 7.5L3 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </summary>
                <div className="faq-content">Yes, it detects data saver modes and connection speed to optimize prefetching.</div>
            </details>
            <details className="faq-item">
                <summary className="faq-summary">
                    Will it slow down my website?
                    <svg className="faq-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 4.5L6 7.5L3 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </summary>
                <div className="faq-content">No, it’s a tiny script that preloads only on user interaction, keeping performance fast.</div>
            </details>
            <details className="faq-item">
                <summary className="faq-summary">
                    How can I test its impact?
                    <svg className="faq-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 4.5L6 7.5L3 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </summary>
                <div className="faq-content">Compare Speed before and after using GTmetrix, PageSpeed Insights, or Chrome DevTools.</div>
            </details>
        </div>


        {/* NEW: Customer Reviews Section */}
        <div style={{ marginTop: "24px" }}>
            <div style={{ fontWeight: 700, fontSize: "20px", color: "#202223", textAlign: "center", marginBottom: "24px" }}>What Our Merchants Say</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
                {/* Review 1 */}
                <div style={{ background: "#fff", border: "1px solid #e1e3e5", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
                    <div style={{ color: "#fbbf24", fontSize: "16px", marginBottom: "8px" }}>★★★★★</div>
                    {/* FIX: Removed quotes from the text content */}
                    <p style={{ fontSize: "14px", color: "#202223", lineHeight: "1.5", marginBottom: "12px" }}>This app is a must-have! My store's pages load almost instantly now. My customers have noticed the difference.</p>
                    <div style={{ fontSize: "12px", color: "#6d7175", fontWeight: 600 }}>- Jessica R.</div>
                </div>
                {/* Review 2 */}
                <div style={{ background: "#fff", border: "1px solid #e1e3e5", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
                    <div style={{ color: "#fbbf24", fontSize: "16px", marginBottom: "8px" }}>★★★★★</div>
                    {/* FIX: Removed quotes from the text content */}
                    <p style={{ fontSize: "14px", color: "#202223", lineHeight: "1.5", marginBottom: "12px" }}>Easy to set up and it just works. Saw a small but noticeable increase in my conversion rate after installing.</p>
                    <div style={{ fontSize: "12px", color: "#6d7175", fontWeight: 600 }}>- Mark T.</div>
                </div>
                {/* Review 3 */}
                <div style={{ background: "#fff", border: "1px solid #e1e3e5", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
                    <div style={{ color: "#fbbf24", fontSize: "16px", marginBottom: "8px" }}>★★★★★</div>
                    {/* FIX: Removed quotes from the text content */}
                    <p style={{ fontSize: "14px", color: "#202223", lineHeight: "1.5", marginBottom: "12px" }}>Finally, an app that actually improves perceived speed without breaking anything. Fantastic support, too!</p>
                    <div style={{ fontSize: "12px", color: "#6d7175", fontWeight: 600 }}>- Alisha K.</div>
                </div>
                {/* Review 4 */}
                <div style={{ background: "#fff", border: "1px solid #e1e3e5", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
                    <div style={{ color: "#fbbf24", fontSize: "16px", marginBottom: "8px" }}>★★★★★</div>
                    {/* FIX: Removed quotes from the text content */}
                    <p style={{ fontSize: "14px", color: "#202223", lineHeight: "1.5", marginBottom: "12px" }}>The best speed optimization app on the Shopify App Store. It's simple, effective, and worth every penny.</p>
                    <div style={{ fontSize: "12px", color: "#6d7175", fontWeight: 600 }}>- David L.</div>
                </div>
            </div>
        </div>

        {/* Animations for the new section */}
        <style>{`
            @keyframes loadSlow {
                from { width: 0%; }
                to { width: 100%; }
            }
            @keyframes loadFast {
                from { width: 0%; }
                to { width: 100%; }
            }
            @keyframes sa-spin { to { transform: rotate(360deg); } }
        `}</style>
    </div>

    {showVideoModal && (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(0,0,0,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
            }}
        >
            <div
                style={{
                    background: "#fff",
                    width: "90%",
                    maxWidth: "800px",
                    borderRadius: "12px",
                    padding: "24px",
                    position: "relative",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
            >
                {/* Close Button */}
                <button
                    onClick={() => setShowVideoModal(false)}
                    style={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        background: "transparent",
                        border: "none",
                        fontSize: "24px",
                        cursor: "pointer",
                        color: "#6d7175",
                        lineHeight: 1,
                        padding: "4px",
                        borderRadius: "4px",
                        transition: "background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = "#f3f4f6"}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = "transparent"}
                >
                    ✖
                </button>

                {/* Video */}
                <div style={{ width: "100%", paddingTop: "56.25%", position: "relative", borderRadius: "8px", overflow: "hidden", background: "#000" }}>
                    <iframe
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                        src="https://www.youtube.com/embed/dQw4w9WgXcQ"   // your video URL here
                        title="Video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            </div>
        </div>
    )}
</s-section>


      </s-page>
    </>
  );
}
