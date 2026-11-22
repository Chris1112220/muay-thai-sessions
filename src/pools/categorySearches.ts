import type { Category } from "../videos";

export interface CategorySearchConfig {
  phrases: string[];
  relevanceLanguage?: string;
}

export const CATEGORY_SEARCHES: Record<Category, CategorySearchConfig> = {
  Training: {
    phrases: ["muay thai technique", "muay thai drills", "muay thai beginner training"],
    relevanceLanguage: "en",
  },
  Fights: {
    phrases: ["muay thai full fight", "Lumpinee fight", "Rajadamnern fight"],
  },
  History: {
    phrases: ["muay thai history documentary", "muay boran", "legendary muay thai fighters"],
    relevanceLanguage: "en",
  },
};