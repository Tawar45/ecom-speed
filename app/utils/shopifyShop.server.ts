export async function getShopNameAndEmail(
  shop: string,
  accessToken: string
) {
  const response = await fetch(
    `https://${shop}/admin/api/2024-10/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({
        query: `
          query {
            shop {
              name
              email
              myshopifyDomain
            }
          }
        `,
      }),
    }
  );

  const json = await response.json();

  if (json.errors) {
    throw new Error(JSON.stringify(json.errors));
  }

  return {
    shopName: json.data.shop.name,
    email: json.data.shop.email,
    domain: json.data.shop.myshopifyDomain,
  };
}
