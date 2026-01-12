import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);


  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (shop) {
    const existingShop = await prisma.shop.findUnique({
      where: { domain: shop },
    });

    if (!existingShop) {
      console.warn(`No existing shop record found for ${shop}, skipping uninstallation process.`);
      return new Response();
    }
  }
  if (session) {
    await db.session.deleteMany({ where: { shop } });
  }

  return new Response();
};
