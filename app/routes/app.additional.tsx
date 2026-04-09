import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import  Header from "../component/header";
export default function SendEmailPage() {
  const data = useLoaderData() as {
    success: boolean;
    shopDomain?: string;
    message?: string;
    error?: string;
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Send Test Email ririk</h1>
      <Header/>

    </div>
  );
}
