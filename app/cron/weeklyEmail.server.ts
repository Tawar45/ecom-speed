import cron from "node-cron";
import prisma from "../db.server";
import { sendWeekEmail } from "../utils/email.server";

/**
 * Check if weekly email should be sent
 */
function formatUTCDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function shouldSendWeeklyEmail(lastSent: Date | null): boolean {
  if (!lastSent) return true;
  const now = new Date();
  const diffDays = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 7;
}

console.log("✅ Weekly email cron loaded");
/**
 * ⏱ CRON SCHEDULE
 * For testing: every minute
 * For production: "0 0 * * 0" (every Sunday)
 */
// cron.schedule("* * * * * *", () => {
//   console.log("Every second");
// });

cron.schedule("* * * * *", async () => {
  console.log("⏱ Weekly cron running", new Date().toISOString());
  try {
    // 1️⃣ Get all eligible shops
    const shops = await prisma.shop.findMany({
      where: {
        weeklyEmailEnabled: true,
        email: { not: null },
      },
    });
 
    let currentDate = new Date();
    let afterOneWeek = new Date();
    afterOneWeek.setDate(currentDate.getDate() + 7); 
    let currentDateUTC = formatUTCDate(currentDate);
    let afterOneWeekUTC = formatUTCDate(afterOneWeek);

    for (const shop of shops) {
      // 2️⃣ Check last weekly email
      console.log(shop.lastWeeklyEmailAt,'demo by user that');

      if (!shouldSendWeeklyEmail(shop.lastWeeklyEmailAt)) {
        console.log(`⏭ Skip ${shop.domain} (already sent this week)`);
        continue;
      }
      try {
        // 3️⃣ Send weekly email
        console.log("inside try catch by user that.");
        await sendWeekEmail(shop.domain, shop.email!, currentDateUTC, afterOneWeekUTC);
        // 4️⃣ Update last sent time
        await prisma.shop.update({
          where: { id: shop.id },
          data: {
            lastWeeklyEmailAt: currentDate,
          },
        });

        console.log(`✅ Weekly email sent to ${shop.domain}`);
      } catch (emailError) {
        console.error(`❌ Email failed for ${shop.domain}`, emailError);
      }
    }
  } catch (error) {
    console.error("❌ Weekly cron error:", error);
  }
});
