// app.tsx (fixed)
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
// rename to avoid collision with Polaris AppProvider
import { AppProvider as RouterAppProvider } from "@shopify/shopify-app-react-router/react";
// Polaris AppProvider + i18n + styles
import { AppProvider as PolarisProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    // Polaris must be outer provider so Polaris components get i18n/context
    <PolarisProvider i18n={enTranslations}>
      {/* App bridge / router provider stays inside (passes apiKey etc.) */}
      <RouterAppProvider embedded apiKey={apiKey}>
        <s-app-nav>
          <s-link href="/app">Home</s-link>
          {/* <s-link href="/app/additional">Additional page</s-link> */}
          <s-link href="/app/pricing">Pricing page</s-link>
          {/* <s-link href="/app/billing/cancel">Cancel Subscription</s-link> */}
        </s-app-nav>

        <Outlet />
      </RouterAppProvider>
    </PolarisProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
