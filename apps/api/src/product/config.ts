export type ProductConfig = {
  trialAiAllowance: number;
  priceMonthlyInr: number;
  paidAiAllowance: number;
};
export const trialDays = 14 as const;
export const defaultProductConfig: ProductConfig = {
  trialAiAllowance: 20,
  priceMonthlyInr: 99,
  paidAiAllowance: 30,
};
export function publicConfig(config: ProductConfig = defaultProductConfig) {
  return {
    ...config,
    trialDays,
    integrations: { googleBusiness: false, aiReplies: false, payments: false },
    contactAvailable: true,
  };
}
