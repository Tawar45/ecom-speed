// app/routes/auth.callback.tsx
import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";
import { sendWelcomeEmailInstalledMaill } from "../utils/email.server";
import { authenticate } from "../shopify.server"; // temporarily disabled for static session

export const loader = async ({ request }: LoaderFunctionArgs) => {
    console.log("----> [AUTH CALLBACK] Starting authentication callback loader...");

    const { session } = await authenticate.admin(request);


    console.log("----> [AUTH CALLBACK] Authentication successful, session obtained.", session);

    const shopDomain = session.shop;
    console.log("----> [AUTH CALLBACK] Authenticated shop:", shopDomain);

    //  Find existing shop record using domain (not shopId)
    const existingShop = await prisma.shop.findUnique({
        where: { domain: shopDomain },
    });

    console.log("----> [AUTH CALLBACK] Checking welcome email status for shop:", shopDomain, existingShop);

    if (!existingShop?.welcomeEmailSent) {
        //  Send email
        await sendWelcomeEmailInstalledMaill(shopDomain, session.shop);

        //  Use correct upsert shape
        await prisma.shop.upsert({
            where: { domain: shopDomain }, // use `domain` field
            update: { welcomeEmailSent: true, accessToken: session.accessToken },
            create: {
                domain: shopDomain,
                accessToken: session.accessToken,
                welcomeEmailSent: true,
            },
        });

        console.log("----> [AUTH CALLBACK] Welcome email sent and DB updated!");
    } else {
        console.log("----> [AUTH CALLBACK] Welcome email already sent, skipping...");
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
