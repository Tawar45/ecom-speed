import createApp from '@shopify/app-bridge';
import { Redirect } from '@shopify/app-bridge/actions';
import { useEffect } from 'react';

export default function Billingredirect({ url }: { url: string }) {
  useEffect(() => {
    const app = createApp({
      apiKey: process.env.SHOPIFY_API_KEY!,
      host: "https://durgeshg-dev.myshopify.com"
    });

    const redirect = Redirect.create(app);
    redirect.dispatch(Redirect.Action.REMOTE, url);
  }, [url]);

  return (
    <s-page heading="Redirecting to Payment">
      <s-section>
        <s-paragraph>Redirecting to Shopify billing...</s-paragraph>
        <s-paragraph>If you are not redirected automatically, <a href={url}>click here</a>.</s-paragraph>
      </s-section>
    </s-page>
  );
}
