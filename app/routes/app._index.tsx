import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { sendWelcomeEmailInstalledMaill } from "../utils/email.server";
import { useEffect, useState ,useRef  } from "react";
import { d } from "node_modules/@react-router/dev/dist/routes-CZR-bKRt";

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

      shop = await (prisma as any).shop.create({
        data: {
          domain: session.shop,
          accessToken: session.accessToken
        }
      });
      console.log(" [DASHBOARD] Shop created:", { id: shop.id, domain: shop.domain });


      // welcome email login 
      if (!shop?.welcomeEmailSent) {
        //  Send email
        sendWelcomeEmailInstalledMaill(session.shop, session.shop).catch(err => {
          console.error(" [DASHBOARD] Failed to send welcome email:", err);
        });
        //  Use correct upsert shape
        await prisma.shop.update({
          where: { domain: session.shop }, // use `domain` field
          data: { welcomeEmailSent: true, accessToken: session.accessToken },

        });
      }

    } else {
      console.log(" [DASHBOARD] Updating shop access token...");
      await (prisma as any).shop.update({
        where: { id: shop.id },
        data: { accessToken: session.accessToken }
      });
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
  const { shop } = useLoaderData<typeof loader>();
  const [themeId, setThemeId] = useState<string | null>(null);
  const [embededApp, setEmbededApp] = useState<any>();
  const [extensionId, setExtensionId] = useState<any>();
  const [embededAppName, setEmbededAppName] = useState<string | null>();
  const [themes, setThemes] = useState<any[]>([]);
  const [loadingThemes, setLoadingThemes] = useState(true);
  const embededAppId = import.meta.env.VITE_EMBEDED_APP_ID || "ecom_expert_speed";
  const extensionUID = import.meta.env.VITE_EXTENSION_UID || "f22c61f2-e375-d812-a729-baeb02a21c3888376b59";
  const extensionNAME = import.meta.env.VITE_EXTENSION_NAME;
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
              setExtensionId(extractEmbededAppId(embedItem.type));
              setEmbededAppName(extractBlockType(embedItem.type));
            } else {
              setExtensionId(null);
              setEmbededAppName(null);
            }
          } else {
            // No embed item/settings found -> treat as Off (false)
            setEmbededApp(false);
            setExtensionId(null);
            setEmbededAppName(null);
            console.warn("No embedEnabled settings found in response.");
          }
          if (data.themes?.length > 0) {
            const main = data.themes.find((t: any) => t.role === "MAIN");
            // console.log("Active theme found-------------data---:", data);
            if (main) setThemeId(main.id.split("/").pop());
          }
        } else {
          console.error(" Failed to fetch theme toggle data:", data);
        }
      } catch (error) {
        console.error(" Error fetching theme toggle data:", error);
      } finally {
        setLoadingThemes(false);
      }
    };
    // console.log("Fetching theme data for dashboard...");
    fetchThemeData(); //  run the async function 
  }, []);

  const openEmbedSettings = () => {
    if (!themeId || !shop?.domain || !embededAppName || !extensionId || !embededAppName) {
      {
        console.error("⚠️ Missing data to open embed settings:", { themeId, shopDomain: shop?.domain, embededAppName, extensionId });
        return;
      };
    }
    const url = `https://${shop?.domain}/admin/themes/current/editor?context=apps&activateAppId=${'9d591d9d-d0a0-81be-f2f9-13c6f8bbddf27131df19'}/${'ecom_expert_speed'}`;
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
          <div
            style={{
              border: "1px solid #e1e1e1",
              borderRadius: "8px",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "Inter, sans-serif",
              backgroundColor: "#fff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "18px" }}>🧩</span>
              <span style={{ fontWeight: 500 }}>Theme store app embed</span>
              <span
                style={{
                  marginLeft: "8px",
                  backgroundColor: embededApp ? "#dcfce7" : "#f1f1f1",
                  color: embededApp ? "#16a34a" : "#666",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {embededApp ? "On" : "Off"}
              </span>
            </div>

            <button
              onClick={openEmbedSettings}
              style={{
                backgroundColor: "#fff",
                border: "1px solid #d1d1d1",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              App embed settings
            </button>
          </div>
        </s-section>
        <s-section>
    <div style={{ display: "block", gap: 16, fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Promo bar */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e6e6e6",
          borderRadius: 8,
          padding: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              background: "#faf5ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img src={logoUrl} alt="app" style={{ width: 28, height: 28, objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>Improve your store's Google ranking</div>
            <div style={{ fontSize: 13, color: "#666" }}>technical SEO, competitor website traffic analysis, etc.</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            style={{
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              padding: "8px 14px",
              borderRadius: 6,
              cursor: "pointer",
            }}
            type="button"
          >
            Get 30% off
          </button>
        </div>
      </div>

      {/* Two columns */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        {/* Web performance */}
        <div
          style={{
            flex: 1,
            background: "#fff",
            border: "1px solid #e6e6e6",
            borderRadius: 8,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Web performance</div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          {/* circle area */}
        <div
          onClick={handleClick}
          style={{
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              border: "8px solid #e5e7eb",
              borderTopColor: "#10b981", // green
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
        </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 13, color: "#555" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
              0-49
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
              50-84
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
              85-100
            </span>
          </div>
        </div>

        {/* Site speed */}
        <div style={{ flex: 1,background: "#fff",border: "1px solid #e6e6e6",borderRadius: 8,padding: 20,display: "flex",flexDirection: "column",alignItems: "center",justifyContent: "center",}}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Site Speed Up</div>
          <img   src={embededApp ? '../../speed_on.png' : '../../speed_off.png'} alt="rocket" style={{ width: 220, height: 160, objectFit: "contain", opacity: 0.95 }} />
          <div style={{ marginTop: 6, background: embededApp ? "#dcfce7" : "#f3f4f6", color: embededApp ? "#16a34a" : "#555",fontSize: 12,padding: "2px 8px",borderRadius: 12,display: "inline-block",fontWeight: 600,}}>{embededApp ? "On" : "Off"}</div>        
          <div style={{ marginTop: 12, fontSize: 13, color: "#666", textAlign: "center" }}>Enable Shopify embed to speed up your store</div>
          <button
            onClick={() => openEmbedSettings()}
            style={{
              marginTop: 12,
              background: embededApp ? "#f59e0b" : "#efefef",
              border: "none",
              padding: "8px 14px",
              borderRadius: 6,
              cursor: "pointer",
            }}
            type="button"
          >
            ⚡ Speed up
          </button>
        </div>
      </div>

      {/* How it works */}
      <div style={{ background: "#fff", border: "1px solid #e6e6e6", borderRadius: 8, padding: 16, display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>How Ecom speed Page speed Optimizer works</div>
          <div style={{ color: "#555", marginTop: 8, fontSize: 14 }}>
            When your customers hover a link for more than 65 ms, this app will automatically request the link's destination.
            This typically results in an average perceived reduction of latency of 200-300 ms.
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d1d1", background: "#fff", cursor: "pointer" }} type="button">Preview</button>
            <button style={{ padding: "8px 12px", borderRadius: 6, border: "none", background: "#fff", color: "#4f46e5", cursor: "pointer" }} type="button"  onClick={() => setShowVideoModal(true)}>Watch the video</button>
          </div>
        </div>

        <div style={{ width: 180 }}>
          <img src={logoUrl} alt="thumb" style={{ width: "100%", height: 92, objectFit: "cover", borderRadius: 6 }} />
        </div>
      </div>

      {/* FAQ */}
      <div style={{ background: "#fff", border: "1px solid #e6e6e6", borderRadius: 8, padding: 16 }}>
        <div style={{ fontWeight: 700 }}>Frequently Asked Questions</div>
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>How does this feature work?</summary>
          <div style={{ color: "#555", marginTop: 8 }}>
            When your customers hover a link for more than 65 ms, this app automatically preloads the destination page. This results in faster perceived loading times.
          </div>
        </details>
      </div>

      <style>{`@keyframes sa-spin { to { transform: rotate(360deg); } }`}</style>
    </div>

    {showVideoModal && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.55)",
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
        maxWidth: "700px",
        borderRadius: "10px",
        padding: "20px",
        position: "relative",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
      }}
    >
      {/* Close Button */}
      <button
        onClick={() => setShowVideoModal(false)}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "transparent",
          border: "none",
          fontSize: "20px",
          cursor: "pointer",
        }}
      >
        ✖
      </button>

      {/* Video */}
      <div style={{ width: "100%", height: "400px" }}>
        <iframe
          width="100%"
          height="100%"
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