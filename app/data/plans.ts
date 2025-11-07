// app/data/plans.ts

export interface Plan {
    name: string;
    price: number;
    plan: string;
    features: string[];
  }
  
  export const plans: Plan[] = [
    {
      name: "Basic",
      price: 10,
      plan: "basic",
      features: ["Basic features", "Email support", "Standard analytics"],
    },
    {
      name: "Pro",
      price: 20,
      plan: "pro",
      features: [
        "All Basic features",
        "Priority support",
        "Advanced analytics",
        "API access",
      ],
    },
    {
      name: "Business",
      price: 30,
      plan: "business",
      features: [
        "All Pro features",
        "24/7 support",
        "Custom integrations",
        "White-label options",
      ],
    },
  ];
  