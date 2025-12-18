import { authenticate } from "../shopify.server";
import type { ActionFunctionArgs } from "react-router";

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.webhook(request);

  console.log("✅ GDPR: customers/data_request received");

  return new Response("OK", { status: 200 });
};
