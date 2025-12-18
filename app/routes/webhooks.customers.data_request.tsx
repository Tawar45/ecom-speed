import { authenticate } from "../shopify.server";
import type { ActionFunctionArgs } from "react-router";

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.webhook(request);

  console.log("✅ GDPR: shop/customer received");

  // Delete shop data from DB here

  return new Response("OK", { status: 200 });
};
