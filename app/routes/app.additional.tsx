import nodemailer from "nodemailer";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";

export async function loader({ request }: { request: Request }) {
  // ✅ Authenticate Shopify admin
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop || "test.myshopify.com";

  // ✅ Configure SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER || "your@gmail.com",
      pass: process.env.SMTP_PASS || "your_app_password",
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL || "your@gmail.com",
    to: `rohit45.tawar@gmail.com`, // or your own email for testing
    subject: "Hello from Shopify App 👋",
    html: `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Hello 👋</h2>
        <p>This is a test email sent from your Shopify app using React Router.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${shopDomain}`);

    // ✅ Just return plain data (no json())
    return {
      success: true,
      shopDomain,
      message: `Email sent successfully to ${shopDomain}`,
    };
  } catch (error: any) {
    console.error("❌ Error sending email:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export default function SendEmailPage() {
  const data = useLoaderData() as {
    success: boolean;
    shopDomain?: string;
    message?: string;
    error?: string;
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>📧 Send Test Email</h1>

      {data?.success ? (
        <p>✅ {data.message}</p>
      ) : (
        <p>❌ Failed to send email: {data.error}</p>
      )}
    </div>
  );
}
