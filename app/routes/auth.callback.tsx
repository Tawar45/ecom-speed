// app/routes/auth.callback.tsx
import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";
import { sendWelcomeEmailInstalledMaill } from "../utils/email.server";
import { authenticate } from "../shopify.server";
import { getShopInfo } from "app/utils/graphql-query";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin, redirect } = await authenticate.admin(request);
console.log('------------callback---------------------------');
  if (!session || !session?.accessToken) {
    console.warn("[auth.callback] Session error");
    return new Response(null, {
      status: 302,
      headers: { Location: `/auth/login?shop=${new URL(request.url).searchParams.get("shop") || ""}` },
    });
  }

  if (!admin) {
    console.warn("[auth.callback] Admin not found");
    const host = new URL(request.url).searchParams.get("host");
    const location = host ? `/app?shop=${session.shop}&host=${host}` : `/app?shop=${session.shop}`;
    return new Response(null, { status: 302, headers: { Location: location } });
  }
  //  IMPORTANT: Shopify might require a redirect (OAuth handshake)
  if (redirect) return redirect;

  // Lookup shop record
  const existingShop = await prisma.shop.findUnique({
    where: { domain: session.shop },
  });

  if (!existingShop?.welcomeEmailSent) {
    // Send email
    const ShopInfoResult = await getShopInfo(admin);
    const welcomeEmailSent = await sendWelcomeEmailInstalledMaill(ShopInfoResult);

    // Save or update shop in database
    await prisma.shop.upsert({
      where: { domain: session.shop },
      update: {
        welcomeEmailSent,
        accessToken: session.accessToken,
      },
      create: {
        domain: session.shop,
        accessToken: session?.accessToken,
        welcomeEmailSent,
      },
    });
  }

  // After authentication → Shopify requires redirect to your app home
  const url = new URL(request.url);
  const host = url.searchParams.get("host");
  const location = host ? `/app?shop=${session.shop}&host=${host}` : `/app?shop=${session.shop}`;
  return new Response(null, {
    status: 302,
    headers: {
      Location: location
    },
  });
};
