# Onboarding UX Copy

## Principle
Default path should be short, obvious, and safe. Advanced controls are available but never required for first success.

## Welcome Screen

**Title:** Welcome to Autonomyx Fast SaaS Toolkit  
**Body:** Let’s get your production-ready SaaS stack running in about 30 minutes. We’ll guide domain setup, security, modules, and deployment.

**Primary button:** Start setup  
**Secondary link:** I want advanced options

## Step 1: Project Basics

**Prompt:** What are you building?  
- Project name
- Admin email
- Preferred deployment target (Local, VPS, Coolify)

**Helper copy:** You can change these later from project settings.

## Step 2: Module Profile

**Title:** Choose your starting profile  
- Launch Fast (Recommended)
- Growth Ready
- AI Ready

**Helper copy:** Start with fewer modules for faster setup. You can add more anytime.

## Step 3: Domain and Routing

**Prompt:** Where should your services be reachable?  
- Domain input
- DNS check button

**Error copy:** We couldn’t verify your DNS yet. Update records, then re-run check.

## Step 4: Secrets and Security

**Prompt:** Create secure service credentials  
- Auto-generate secrets (default)
- Bring your own secrets (advanced)

**Confirmation copy:** All required secrets passed security validation.

## Step 5: Preflight Check

**Checklist items:**
- Docker running
- Required ports available
- DNS ready
- Env schema valid
- Disk/memory minimums met

**Success state:** Your environment is ready to deploy.  
**Failure state:** We found issues. Fix them below, then retry.

## Step 6: Deploy

**Action:** Deploy now  
**Progress copy:** Provisioning services in dependency order…

## Final Success Screen

**Title:** Your SaaS platform is live 🎉  
**Body:** Next, create your first tenant, invite a teammate, and run your health dashboard.

**Primary button:** Open dashboard  
**Secondary button:** View quickstart docs

## Empty States

- **No tenants yet:** Create your first tenant to start onboarding customers.
- **No billing configured:** Connect billing to enable subscriptions and usage-based plans.
- **No alerts configured:** Enable at least one alert channel to monitor service health.

