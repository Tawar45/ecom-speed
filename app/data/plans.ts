// app/data/plans.ts

export interface Plan {
    name: string;
    price: number;
    plan: string;
    features: string[];
  }
  
  export const plans: Plan[] = [
    {
      name: "Free Forever Plan",
      price: 0,
      plan: "basic",
      features: [
  "Speed Optimization on the Homepage",
  "Delivers smoother shopping experience",
  "Helps increase conversions and sales",
  "Fully optimized for all device types",
  "No maintenance needed — runs automatically",
  "Great for growing stores",
  "Reduces drop-offs during home page browsing",
  "Provides stronger overall performance results",
  "Includes standard support"
],

    },
    {
      name: "Expert Plan ",
      price: 9,
      plan: "Expert Plan",
      features: [
      "All Features of the Free plan",
      "Speed Optimization on all pages across the store",
      "Advanced handling for mobile & slow networks",
      "Optimized for all medium & high-traffic stores",
      "Reduces drop-offs during home, collection,product & cart browsing",
      "Includes priority support"
    ],
    },
    {
      name: "Expert Yearly Plan",
      price: 79,
      plan: "Yearly Plan",
      features: [
        "Get approximately 27% off by choosing annual billing"
      ],
    },
  ];
  