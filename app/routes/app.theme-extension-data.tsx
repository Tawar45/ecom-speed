import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { useEffect, useState } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const app_hnandle = import.meta.env.VITE_EMBEDED_app_handle || "buy-plan-2";


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
    // 2) fetch settings_data.json via GraphQL theme files (or use REST Asset)
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
    if (!content) return { isEmbedEnabled: false };



    const settings = JSON.parse(removeComments(content));
    const blocks = settings?.current?.blocks || {};
    console.log("--==Is app embed enabled:-----", blocks, app_hnandle);
    console.log("--==Is app embed enabled:-----", findEmbedInSettings(removeComments(content), app_hnandle));
    return {
      success: true,
      shop: {
        domain: session.shop,
        subscription: null, // keep your expected output shape
      },
      themes,
      activeTheme,
      embedEnabled: findEmbedInSettings(removeComments(content), app_hnandle) || null,
    };
  } catch (error) {
    console.error("Error fetching Shopify themes:", error);
    return {
      success: false,
      shop: {
        domain: session.shop,
        subscription: null,
      },
      themes: [],
      activeTheme: null,
      embedEnabled: null,
    };
  }
};



function removeComments(content: any) {
  return content.replace(/\/\*[\s\S]*?\*\//, '').trim();
}



// 2 Check if app embed is enabled inside settings_data.json
function findEmbedInSettings(settingsContent: any, APP_HANDLE: any) {
  try {
    const settings = JSON.parse(settingsContent);
    const blocks = settings?.current?.blocks || {};

    // Find matching block
    const foundBlock = Object.values(blocks).find(
      (block: any) => block.type.includes(`shopify://apps/${APP_HANDLE}/blocks`)
    );

    if (!foundBlock) return false;

    // Disabled = false means it's enabled in theme
    return foundBlock
  } catch (error) {
    console.error("Error parsing or finding embed:", error);
    return false;
  }
}


