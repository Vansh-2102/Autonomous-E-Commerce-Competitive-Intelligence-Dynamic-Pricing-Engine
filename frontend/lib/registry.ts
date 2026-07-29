import React from "react";
import { PricingRecommendationCardComponent } from "@/components/PricingRecommendationCard";
import { PricingEvent } from "@/types/pricing";

// Registry map of backend string identifier -> React component implementation
export const COMPONENT_REGISTRY: Record<string, React.ComponentType<any>> = {
  PricingRecommendationCard: PricingRecommendationCardComponent,
};

export function registerComponent(name: string, component: React.ComponentType<any>) {
  COMPONENT_REGISTRY[name] = component;
}
