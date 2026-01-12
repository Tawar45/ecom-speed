import { authenticate } from "../shopify.server";
import type { ActionFunctionArgs } from "react-router";

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.webhook(request);

  return new Response("OK", { status: 200 });
};

