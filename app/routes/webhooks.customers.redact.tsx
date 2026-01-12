
import { authenticate } from "../shopify.server";
import type { ActionFunctionArgs } from "react-router";

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.webhook(request);

  // Delete customer data from DB here (if stored)

  return new Response("OK", { status: 200 });
};
