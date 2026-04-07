# Langfuse — LLM Observability

## URL
`observe.DOMAIN`

## What It Tracks
- **Traces** — every LLM call (prompts, completions, latency, tokens, cost)
- **Evaluations** — score outputs for quality, hallucination, relevance
- **Prompt management** — version and A/B test prompts centrally
- **Cost tracking** — per-user and per-tenant LLM spend
- **Sessions** — group related LLM calls into conversations

## Post-Setup Steps
1. Visit `https://observe.DOMAIN` and create your admin account
2. Create a project and copy the public/secret API keys
3. Instrument your AI services (see below)

## Instrumenting LibreChat
Add to LibreChat's environment:
```
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=http://langfuse:3000
```

## Instrumenting Langflow
Add Langfuse callback in Langflow flow settings or pass via API:
```python
from langfuse.callback import CallbackHandler
handler = CallbackHandler(
    public_key="pk-lf-...",
    secret_key="sk-lf-...",
    host="http://langfuse:3000"
)
```

## Instrumenting Claude Agent
Add to claude-agent environment to trace all Claude API calls:
```
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=http://langfuse:3000
```

## Integration with Billing (Lago)
Langfuse tracks token usage and cost per trace. Export cost data to
Lago for per-tenant LLM billing via n8n workflow:
1. n8n → Query Langfuse API for daily cost by user/tenant
2. n8n → Send usage event to Lago (`event_type: "llm_tokens"`)
3. Lago → Add to monthly invoice

## Database
Shares the toolkit's PostgreSQL (database: `langfuse`). Created automatically by `setup.sh`.

## Environment Variables
| Variable | Description |
|---|---|
| `LANGFUSE_SECRET_KEY` | NextAuth encryption secret |
| `LANGFUSE_SALT` | Password hashing salt |
| `LANGFUSE_TELEMETRY_ENABLED` | Disable telemetry (default: false) |

## Future Integration Placeholders
- **SignOz** — APM and distributed tracing (alternative/complement to Langfuse for non-LLM observability)
- **Infisical** — Secret management (centralize all API keys instead of .env files)
- **PostHog Cloud** — Product analytics with cloud-hosted option (connect via API key)
