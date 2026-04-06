/**
 * Plan-based feature flags and limits.
 * Define what each pricing tier gets access to.
 */

export interface PlanLimits {
  api_calls_per_month: number;
  storage_mb: number;
  team_members: number;
  features: Record<string, boolean>;
}

export const defaultPlans: Record<string, PlanLimits> = {
  free: {
    api_calls_per_month: 1000,
    storage_mb: 100,
    team_members: 1,
    features: {
      core: true,
      advanced_analytics: false,
      priority_support: false,
      custom_domain: false,
      api_access: false,
      sso: false,
      audit_log: false,
      white_label: false,
    },
  },
  starter: {
    api_calls_per_month: 10000,
    storage_mb: 1000,
    team_members: 5,
    features: {
      core: true,
      advanced_analytics: true,
      priority_support: false,
      custom_domain: false,
      api_access: true,
      sso: false,
      audit_log: false,
      white_label: false,
    },
  },
  pro: {
    api_calls_per_month: 100000,
    storage_mb: 10000,
    team_members: 25,
    features: {
      core: true,
      advanced_analytics: true,
      priority_support: true,
      custom_domain: true,
      api_access: true,
      sso: true,
      audit_log: true,
      white_label: false,
    },
  },
  enterprise: {
    api_calls_per_month: -1, // unlimited
    storage_mb: -1,
    team_members: -1,
    features: {
      core: true,
      advanced_analytics: true,
      priority_support: true,
      custom_domain: true,
      api_access: true,
      sso: true,
      audit_log: true,
      white_label: true,
    },
  },
};

export class FeatureFlags {
  private plans: Record<string, PlanLimits>;

  constructor(plans?: Record<string, PlanLimits>) {
    this.plans = plans || defaultPlans;
  }

  /** Check if a feature is enabled for a given plan */
  hasFeature(plan: string, feature: string): boolean {
    const planConfig = this.plans[plan];
    if (!planConfig) return false;
    return planConfig.features[feature] ?? false;
  }

  /** Get a numeric limit for a given plan (-1 = unlimited) */
  getLimit(plan: string, limit: keyof Omit<PlanLimits, "features">): number {
    const planConfig = this.plans[plan];
    if (!planConfig) return 0;
    return planConfig[limit];
  }

  /** Check if usage is within plan limits */
  isWithinLimit(plan: string, limit: keyof Omit<PlanLimits, "features">, currentUsage: number): boolean {
    const max = this.getLimit(plan, limit);
    if (max === -1) return true; // unlimited
    return currentUsage < max;
  }
}
