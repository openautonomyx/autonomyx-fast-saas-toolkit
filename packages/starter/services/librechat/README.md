# LibreChat — Multi-Model AI Chat

## URL
`chat.DOMAIN`

## Post-Setup Steps
1. Visit `https://chat.DOMAIN` and create your admin account
2. Ollama is pre-configured as a provider — pull a model first: `docker compose exec ollama ollama pull llama3.2`
3. Add API keys for cloud providers in Settings (OpenAI, Anthropic, Google, etc.)
4. Configure SSO via the librechat.yaml if using Logto for auth

## Pre-Configured Providers
- **Ollama** — Local models via `http://ollama:11434/v1` (OpenAI-compatible)
- Add more in `services/librechat/librechat.yaml`

## Architecture
- **MongoDB** sidecar for conversation storage
- **Meilisearch** sidecar for full-text search across conversations
- **Redis** (shared, DB index 4) for sessions and caching
- **Ollama** integration for local LLM inference

## Environment Variables
| Variable | Description |
|---|---|
| `LIBRECHAT_CREDS_KEY` | Encryption key for stored API credentials |
| `LIBRECHAT_CREDS_IV` | Encryption initialization vector |
| `LIBRECHAT_JWT_SECRET` | JWT signing secret |
| `LIBRECHAT_JWT_REFRESH_SECRET` | JWT refresh token secret |
| `LIBRECHAT_MONGODB_PASSWORD` | MongoDB authentication password |
| `MEILI_MASTER_KEY` | Meilisearch admin key |
