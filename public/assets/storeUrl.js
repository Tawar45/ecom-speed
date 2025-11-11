// assets/storeUrl.js

// Multi TLDs
const multiTLDs = new Set([
  'co.uk','gov.uk','ac.uk','org.uk',
  'co.in','gov.in','nic.in',
  'com.au','net.au','org.au','gov.au','edu.au',
  'co.nz','gov.nz',
  'com.sg','com.my','com.ph','com.br','com.tr','com.mx',
  'co.jp','co.kr','co.za',
  'com.cn','net.cn',
  'com.pl','co.id'
]);

function parseHostMain(host) {
  host = (host || '').replace(/^www\./i, '').split(':')[0].toLowerCase();
  const parts = host.split('.').filter(Boolean);
  if (parts.length === 1) return parts[0];
  const last2 = parts.slice(-2).join('.');
  if (multiTLDs.has(last2) && parts.length > 2) return parts[parts.length - 3];
  return parts[parts.length - 2];
}

const hostname = (window.location.hostname || '').toLowerCase();
const pathname = window.location.pathname || '';
const hash = window.location.hash || '';
const searchParams = new URLSearchParams(window.location.search || '');

let shopDomain = null;
let detectedVia = null;

// 1) ?shop= param
let shopParam = searchParams.get('shop') || null;
if (!shopParam && hash) {
  const m = hash.match(/[?&]shop=([^&]+)/i);
  if (m) shopParam = decodeURIComponent(m[1]);
}
if (shopParam) {
  shopParam = shopParam.toLowerCase();
  if (shopParam.endsWith('.myshopify.com')) {
    shopDomain = shopParam.split('.')[0];
    detectedVia = 'shop param .myshopify.com';
  } else {
    shopDomain = shopParam.replace(/^www\./i, '').split('.')[0];
    detectedVia = 'shop param raw';
  }
}

// 2) *.myshopify.com hostname
if (!shopDomain && hostname.endsWith('.myshopify.com')) {
  shopDomain = hostname.split('.')[0];
  detectedVia = 'myshopify hostname';
}

// 3) admin path /store/{shop}
if (!shopDomain) {
  const adminMatch = pathname.match(/\/stores?\/([^\/?#]+)/i);
  if (adminMatch) {
    shopDomain = decodeURIComponent(adminMatch[1]);
    detectedVia = 'admin pathname';
  }
}

// 4) fallback: parse custom domain
if (!shopDomain) {
  shopDomain = parseHostMain(hostname);
  detectedVia = 'hostname fallback';
}

// App Block ID
const appBlockId = "f1d1d8e0f94673545d15b8fa2ef33bc5%2Fecom";

// Client ID from shopify.app.toml - dynamically injected by Vite plugin
const clientId = "TOML_CLIENT_ID_PLACEHOLDER";

// Theme Editor URL
const EmbededStoreURL = `https://admin.shopify.com/store/${shopDomain}/themes/current/editor?context=apps&activateAppId=${appBlockId}`;

// Debug log
console.log("=== Store URL Debug Info ===");
console.log("hostname:", hostname);
console.log("pathname:", pathname);
console.log("hash:", hash);
console.log("search:", window.location.search);
console.log("shopDomain:", shopDomain);
console.log("detected via:", detectedVia);
console.log("EmbededStoreURL:", EmbededStoreURL);
console.log("appBlockId:", appBlockId);
console.log("clientId:", clientId);
console.log("==========================");

// ✅ Export for import usage
export { EmbededStoreURL, shopDomain, detectedVia, clientId };
