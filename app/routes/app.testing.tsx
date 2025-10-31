import nodemailer from "nodemailer";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import {FooterHelp, Link} from '@shopify/polaris';


// export async function loader({ request }: { request: Request }) {
  // ✅ Authenticate Shopify admin
//   const { session } = await authenticate.admin(request);
//   const shopDomain = session.shop || "test.myshopify.com";

//   // ✅ Configure SMTP
//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST || "smtp.gmail.com",
//     port: Number(process.env.SMTP_PORT) || 587,
//     secure: Number(process.env.SMTP_PORT) === 465,
//     auth: {
//       user: process.env.SMTP_USER || "your@gmail.com",
//       pass: process.env.SMTP_PASS || "your_app_password",
//     },
//   });

//   const mailOptions = {
//     from: process.env.SMTP_FROM_EMAIL || "your@gmail.com",
//     to: `rohit45.tawar@gmail.com`, // or your own email for testing
//     subject: "Hello from Shopify App 👋",
//     html: `
//       <div style="font-family: Arial; padding: 20px;">
//         <h2>Hello 👋</h2>
//         <p>This is a test email sent from your Shopify app using React Router.</p>
//       </div>
//     `,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log(`✅ Email sent successfully to ${shopDomain}`);

//     // ✅ Just return plain data (no json())
//     return {
//       success: true,
//       shopDomain,
//       message: `Email sent successfully to ${shopDomain}`,
//     };
//   } catch (error: any) {
//     console.error("❌ Error sending email:", error);
//     return {
//       success: false,
//       error: error.message,
//     };
//   }
// }

export default function SendEmailPage() {

  const data = useLoaderData() as {
    success: boolean;
    shopDomain?: string;
    message?: string;
    error?: string;
  };

//   return start

 return (
  <div style={{ padding: "40px 60px", fontFamily: "Inter, Arial, sans-serif", background: "#f6f6f7" }}>
    
    <h1 style={{ fontSize: "22px", fontWeight: "600", marginBottom: "20px", textAlign: "left" }}>
      Pricing page
    </h1>

    <div style={{ background: "#fff", borderRadius: "8px", padding: "30px", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px", fontSize: "20px", fontWeight: "600" }}>
        Choose your plan
      </h2>

      <div style={{ textAlign: "center", marginBottom: "25px" }}>
        <div style={{ display: "inline-flex", background: "#f1f1f1", borderRadius: "8px", border: "1px solid #ddd" }}>
          <button style={{ padding: "8px 20px", border: "none", background: "#fff", cursor: "pointer", fontSize: "14px", borderRadius: "8px 0 0 8px" }}>Monthly</button>
          <button style={{ padding: "8px 20px", border: "none", background: "#f1f1f1", cursor: "pointer", fontSize: "14px", borderRadius: "0 8px 8px 0" }}>Yearly (Save up to 20%)</button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
        {/* ESSENTIALS */}
        <div style={{ background: "#fff", width: "270px", borderRadius: "10px", boxShadow: "0 1px 5px rgba(0,0,0,0.1)", padding: "18px", textAlign: "center" }}>
          <h3 style={{ fontSize: "14px", marginBottom: "8px", letterSpacing: "0.5px" }}>ESSENTIALS</h3>
          <h1 style={{ fontSize: "28px", margin: "8px 0" }}>
            $25<span style={{ fontSize: "14px" }}>/mo</span>
          </h1>
          <button style={{ width: "100%", padding: "8px", backgroundColor: "#f6f6f7", border: "1px solid #dcdcdc", borderRadius: "6px", cursor: "pointer", marginBottom: "12px" }}>
            Subscribe
          </button>
          <div style={{ background: "#fafafa", borderRadius: "6px", padding: "12px", textAlign: "left", fontSize: "13px" }}>
            <p>✔ All features of <b>Auto Tags</b></p>
            <p>✔ Basic features of <b>Registration Forms</b></p>
            <p>✔ Basic features of <b>Quantity Break</b></p>
            <p>✔ Life-time support</p>
          </div>
        </div>

        {/* ADVANCED */}
        <div style={{ background: "#fff", width: "270px", borderRadius: "10px", boxShadow: "0 1px 5px rgba(0,0,0,0.2)", padding: "18px", textAlign: "center", position: "relative" }}>
          <div style={{ position: "absolute", top: "10px", right: "-35px", background: "#e0f0ff", color: "#007bff", transform: "rotate(45deg)", padding: "4px 38px", fontSize: "11px" }}>
            Current Plan
          </div>
          <h3 style={{ fontSize: "14px", marginBottom: "8px", letterSpacing: "0.5px" }}>
            ADVANCED{" "}
            <span style={{ background: "#fdecef", color: "#d63384", fontSize: "11px", padding: "2px 6px", borderRadius: "6px", marginLeft: "4px" }}>
              Most Popular
            </span>
          </h3>
          <h1 style={{ fontSize: "28px", margin: "8px 0" }}>
            $50<span style={{ fontSize: "14px" }}>/mo</span>
          </h1>
          <button style={{ width: "100%", padding: "8px", backgroundColor: "#fff", border: "1px solid #bf0711", color: "#bf0711", borderRadius: "6px", cursor: "pointer", marginBottom: "12px" }}>
            Unsubscribe
          </button>
          <div style={{ background: "#fafafa", borderRadius: "6px", padding: "12px", textAlign: "left", fontSize: "13px" }}>
            <p>✔ All features of <b>Auto Tags</b></p>
            <p>✔ Most features of <b>Registration Forms</b></p>
            <p>✔ Most features of <b>Quantity Break</b></p>
            <p>✔ Most features of <b>Custom Pricing</b></p>
            <p>✔ All features of <b>Order Limits</b></p>
            <p>✔ All features of <b>Quantity Increment</b></p>
            <p>✔ Most features of <b>Tax Exempt</b></p>
            <p>✔ All features of <b>Shipping Rates</b></p>
            <p>✔ All features of <b>Discount Codes</b></p>
            <p>✔ All features of <b>Multi Currency</b></p>
          </div>
        </div>

        {/* PLATINUM */}
        <div style={{ background: "#fff", width: "270px", borderRadius: "10px", boxShadow: "0 1px 5px rgba(0,0,0,0.1)", padding: "18px", textAlign: "center" }}>
          <h3 style={{ fontSize: "14px", marginBottom: "8px", letterSpacing: "0.5px" }}>PLATINUM</h3>
          <h1 style={{ fontSize: "28px", margin: "8px 0" }}>
            $100<span style={{ fontSize: "14px" }}>/mo</span>
          </h1>
          <button style={{ width: "100%", padding: "8px", backgroundColor: "#f6f6f7", border: "1px solid #dcdcdc", borderRadius: "6px", cursor: "pointer", marginBottom: "12px" }}>
            Subscribe
          </button>
          <div style={{ background: "#fafafa", borderRadius: "6px", padding: "12px", textAlign: "left", fontSize: "13px" }}>
            <p>✔ All features of <b>Auto Tags</b></p>
            <p>✔ All features of <b>Registration Forms</b></p>
            <p>✔ All features of <b>Quantity Break</b></p>
            <p>✔ All features of <b>Custom Pricing</b></p>
            <p>✔ All features of <b>Order Limits</b></p>
            <p>✔ All features of <b>Quantity Increment</b></p>
            <p>✔ All features of <b>Tax Exempt</b></p>
            <p>✔ All features of <b>Shipping Rates</b></p>
            <p>✔ All features of <b>Discount Codes</b></p>
            <p>✔ All features of <b>Multi Currency</b></p>
          </div>
        </div>
      </div>
    </div>

    <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px" }}>
      Learn more about{" "}
      <a href="https://help.shopify.com/manual/orders/fulfill-orders" target="_blank" style={{ color: "#007bff", textDecoration: "none" }}>
        fulfilling orders
      </a>
    </div>
  </div>
);

}

