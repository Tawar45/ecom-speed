// app/routes/auth.callback.tsx
import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";
import { sendWelcomeEmailInstalledMaill } from "../utils/email.server";
import { authenticate } from "../shopify.server"; // temporarily disabled for static session
import { getShopInfo } from "app/utils/graphql-query";
export const loader = async ({ request }: LoaderFunctionArgs) => {

    const { session, admin } = await authenticate.admin(request);

    //  Find existing shop record using domain (not shopId)
    const existingShop = await prisma.shop.findUnique({
        where: { domain: session.shop },
    });

        console.log('existingShop-----callback',existingShop);
    if (!existingShop?.welcomeEmailSent) {
        //  Send email
        const ShopInfoResult = await getShopInfo(admin);
        await sendWelcomeEmailInstalledMaill(ShopInfoResult);

        //  Use correct upsert shape
        await prisma.shop.upsert({
            where: { domain: session.shop }, // use `domain` field
            update: { welcomeEmailSent: true, accessToken: session.accessToken },
            create: {
                domain: session.shop,
                accessToken: session.accessToken,
                welcomeEmailSent: true,
            },
        });

    } else {
    }

    //  Redirect to app home
    //   return new Response(null, {
    //     status: 302,
    //     headers: { Location: "/" },
    //   });
    return {
        success: true,
    }

};
