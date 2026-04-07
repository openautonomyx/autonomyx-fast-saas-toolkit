# Langflow — Visual LLM Workflow Builder

## URL
`flow.DOMAIN`

## Post-Setup Steps
1. Visit `https://flow.DOMAIN` and log in (default: admin / LANGFLOW_SUPERUSER_PASSWORD)
2. Create your first flow using the visual drag-and-drop builder
3. Connect Ollama as an LLM component (pre-configured at `http://ollama:11434`)
4. Use the API to trigger flows: `POST https://flow.DOMAIN/api/v1/run/{flow_id}`

## Integration with Other Services
- **Ollama** — pre-wired as local LLM provider via `OLLAMA_BASE_URL`
- **n8n** — trigger Langflow flows from n8n via HTTP Request node
- **Your app** — call Langflow API to run AI workflows programmatically

## Database
Shares the toolkit's PostgreSQL instance (database: `langflow`). Created automatically by `setup.sh`.

## Environment Variables
| Variable | Description |
|---|---|
| `LANGFLOW_SECRET_KEY` | Application secret key |
| `LANGFLOW_SUPERUSER` | Admin username (default: admin) |
| `LANGFLOW_SUPERUSER_PASSWORD` | Admin password |
| `LANGFLOW_AUTO_LOGIN` | Auto-login on startup (default: true) |
