import cron from "node-cron";
import { sendWeekEmail } from "../utils/email.server";
console.log("✅ Weekly cron file loaded");
// EVERY 1 SECOND (TEST MODE)
cron.schedule("0 */10 * * * *", async () => {
  console.log("⏱ Cron running every 10 minutes", new Date().toISOString());

  // await sendWeekEmail(
  //   "demo-store.myshopify.com",
  //   "rohit45.tawar@gmail.com"
  // );
});