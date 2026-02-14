import { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

/**
 * Shopify theme settings loader
 * - Finds themes, active theme, reads config/settings_data.json, and searches for app blocks
 */

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // support both possible env var spellings; fallback to a default handle
  const app_handle =
    process.env.VITE_EMBEDED_APP_HANDLE ||
    process.env.VITE_EMBEDED_app_handle ||
    process.env.VITE_SHOPIFY_APP_HANDLE ||
    "ecom-speed-experts-2";

  const themeQuery = `
    query {
      themes(first: 5) {
        edges {
          node {
            id
            name
            role
            createdAt
            updatedAt
          }
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(themeQuery);
    const data = await response.json() as any;

    const themes = data?.data?.themes?.edges?.map((edge: any) => edge.node) || [];
    const activeTheme = themes.find((theme: any) => theme.role === "MAIN") || null;

    // If no active theme, return early (no way to fetch settings file)
    if (!activeTheme || !activeTheme.id) {
      return {
        success: true,
        shop: { domain: session.shop, subscription: null },
        themes,
        activeTheme,
        embedEnabled: null,
      };
    }

    // GraphQL to fetch settings_data.json from the theme files
    const fileRes = await admin.graphql(`#graphql
      query ThemeFiles($themeId: ID!) {
        theme(id: $themeId) {
          files(filenames: ["config/settings_data.json"]) {
            nodes {
              body { ... on OnlineStoreThemeFileBodyText { content } }
            }
          }
        }
      }
    `, { variables: { themeId: activeTheme.id } });

    const fileJson = await fileRes.json();
    const content = fileJson?.data?.theme?.files?.nodes?.[0]?.body?.content;
    if (!content) {
      return {
        success: true,
        shop: { domain: session.shop, subscription: null },
        themes,
        activeTheme,
        embedEnabled: null,
      };
    }

    const contentNoComments = removeComments(content);
    const matchingBlocks = findBlocksForApp(contentNoComments, app_handle);


    return {
      success: true,
      shop: {
        domain: session.shop,
        subscription: null,
      },
      themes,
      activeTheme,
      embedEnabled: matchingBlocks.length > 0 ? matchingBlocks : null,
    };
  } catch (error) {
    console.error("Error fetching Shopify themes or settings:", error);
    return {
      success: false,
      shop: {
        domain: session?.shop || null,
        subscription: null,
      },
      themes: [],
      activeTheme: null,
      embedEnabled: null,
    };
  }
};

/* ---------------------- helpers ---------------------- */

/**
 * removeComments
 * - Removes /* ... *\/ and // ... line comments from a JSON-like string so it can be parsed.
 * - Keeps other content intact.
 */
function removeComments(content: string) {
  if (typeof content !== "string") return content;
  // remove block comments /* ... */
  let withoutBlock = content.replace(/\/\*[\s\S]*?\*\//g, "");
  // remove line comments // ... (until line end)
  withoutBlock = withoutBlock.replace(/(^|[^:])\/\/.*$/gm, (m) => {
    // This removes // comments but avoids removing protocol-like http:// (simple heuristic)
    // We used (^|[^:]) in regex, so re-add the prefix from capture group 1
    const prefix = m[0] === "/" ? "" : m[0];
    return prefix;
  });
  return withoutBlock.trim();
}

/**
 * findBlocksForApp
 * - settingsContent: JSON string (settings_data.json) OR already-parsed object
 * - appHandle: the app handle you expect (e.g. "ecom-speed-experts-2" or "ecom-speed-experts")
 * Returns: Array of { id?, key, type, disabled, settings, raw }
 */
function findBlocksForApp(settingsContent: string | object, appHandle: string) {
  try {
    const parsed =
      typeof settingsContent === "string"
        ? JSON.parse(settingsContent)
        : settingsContent;

    const blocks = parsed?.current?.blocks || {};
    if (!blocks || typeof blocks !== "object") return [];

    // normalize incoming handle: lower-case and remove trailing -digits (e.g. -2, -10)
    const normalized = (appHandle || "")
      .toString()
      .toLowerCase()
      .replace(/-\d+$/, "");

    const results: Array<any> = [];

    // first pass: exact "shopify://apps/<slug>/blocks" match using normalized slug
    for (const [key, block] of Object.entries(blocks)) {
      const type = (block as any).type || "";
      // extract the app segment from the block.type if present
      // e.g. "shopify://apps/ecom-speed-experts/blocks/..."
      const m = type.match(/^shopify:\/\/apps\/([^/]+)\/blocks/i);
      const blockApp = m ? m[1].toLowerCase() : null;

      if (blockApp) {
        // normalize block app by removing trailing -digits too
        const blockAppNormalized = blockApp.replace(/-\d+$/, "");
        if (blockAppNormalized === normalized) {
          results.push({
            id: (block as any).id || null,
            key,
            type,
            disabled: (block as any).disabled ?? false,
            settings: (block as any).settings ?? {},
            raw: block,
          });
          continue;
        }
      }
    }

    // second pass (fallback): substring match of normalized slug inside block.type
    if (results.length === 0 && normalized) {
      for (const [key, block] of Object.entries(blocks)) {
        const type = (block as any).type || "";
        if (type.toLowerCase().includes(normalized)) {
          results.push({
            id: (block as any).id || null,
            key,
            type,
            disabled: (block as any).disabled ?? false,
            settings: (block as any).settings ?? {},
            raw: block,
          });
        }
      }
    }

    return results;
  } catch (err) {
    console.error("findBlocksForApp error:", err);
    return [];
  }
}
