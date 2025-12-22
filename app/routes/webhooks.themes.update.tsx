import { authenticate } from "../shopify.server";
import type { ActionFunctionArgs } from "react-router";
// import prisma from "~/db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // 1️⃣ Verify webhook authenticity
    const { topic, shop, payload } = await authenticate.webhook(request);
    console.log(payload,'payload')

    if (topic !== "THEMES_UPDATE") {
      return new Response("Ignored", { status: 200 });
    }

    console.log("✅ Theme update webhook received for:", shop);

    // 2️⃣ Fetch app embed status after theme update
    // const embedEnabled = await getAppEmbedStatus(shop);

    // 3️⃣ Save status in DB
    // await prisma.shop.update({
    //   where: { domain: shop },
    //   data: {
    //     embedEnabled,
    //   },
    // });

    // console.log("🔁 Embed status synced:", embedEnabled);

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("❌ Theme webhook error", err);
    return new Response("Error", { status: 500 });
  }
};
