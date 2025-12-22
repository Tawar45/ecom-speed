// app/utils/getShopInfo.server.ts

export async function getShopInfo(admin: any) {
  const query = `#graphql
    {
      shop {
        email
        contactEmail
        myshopifyDomain
        name
      }
    }
  `;

  const response = await admin.graphql(query);
  const { data } = await response.json();

  if (!data?.shop) {
    throw new Error("Failed to fetch shop information");
  }

  return {
    email: data.shop.contactEmail || data.shop.email,
    contactEmail: data.shop.contactEmail,
    domain: data.shop.myshopifyDomain,
    name: data.shop.name,
  };
}
