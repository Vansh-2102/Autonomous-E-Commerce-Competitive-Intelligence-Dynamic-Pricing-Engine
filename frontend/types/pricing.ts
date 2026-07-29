export type CompetitorPrice = {
  name: string;
  price: number;
  inStock: boolean;
};

export type ChartPoint = {
  day: string;
  ourPrice: number;
  marketAvg: number;
};

export type PricingRecommendationCardProps = {
  sku: string;
  currentPrice: number;
  recommendedPrice: number;
  expectedMarginDelta: string;
  competitorPrices: CompetitorPrice[];
  chartData: ChartPoint[];
  isApproved?: boolean;
  onApprove?: (sku: string) => void;
};

export type PricingRecommendationCard = {
  component: "PricingRecommendationCard";
  props: PricingRecommendationCardProps;
};

// Union type for generative UI component registry expansion
export type PricingEvent = PricingRecommendationCard;
