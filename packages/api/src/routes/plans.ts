import { Router } from "express";

// Inline the plan definitions to avoid importing the middleware package at runtime
const defaultPlans: Record<string, any> = {
  free: {
    api_calls_per_month: 1000, storage_mb: 100, team_members: 1,
    features: { core: true, advanced_analytics: false, priority_support: false, custom_domain: false, api_access: false, sso: false, audit_log: false, white_label: false },
  },
  starter: {
    api_calls_per_month: 10000, storage_mb: 1000, team_members: 5,
    features: { core: true, advanced_analytics: true, priority_support: false, custom_domain: false, api_access: true, sso: false, audit_log: false, white_label: false },
  },
  pro: {
    api_calls_per_month: 100000, storage_mb: 10000, team_members: 25,
    features: { core: true, advanced_analytics: true, priority_support: true, custom_domain: true, api_access: true, sso: true, audit_log: true, white_label: false },
  },
  enterprise: {
    api_calls_per_month: -1, storage_mb: -1, team_members: -1,
    features: { core: true, advanced_analytics: true, priority_support: true, custom_domain: true, api_access: true, sso: true, audit_log: true, white_label: true },
  },
};

export function plansRouter() {
  const router = Router();

  // GET /api/v1/plans — list all plans
  router.get("/", (_req, res) => {
    const plans = Object.entries(defaultPlans).map(([code, limits]) => ({ code, ...limits }));
    res.json({ data: plans, error: null });
  });

  // GET /api/v1/plans/:plan/check/:feature — check if feature enabled
  router.get("/:plan/check/:feature", (req, res) => {
    const { plan, feature } = req.params;
    const planDef = defaultPlans[plan];
    if (!planDef) {
      return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: `Plan '${plan}' not found` } });
    }
    const enabled = planDef.features[feature] ?? false;
    res.json({ data: { plan, feature, enabled }, error: null });
  });

  return router;
}
