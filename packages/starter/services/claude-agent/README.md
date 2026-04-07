# Claude Agent Runner — Containerized Claude Code

## URL
`agent.DOMAIN`

## Post-Setup Steps
1. Set `ANTHROPIC_API_KEY` in `.env` (your Anthropic API key)
2. Set `CLAUDE_AGENT_API_KEY` in `.env` (for authenticating to this runner)
3. Start the service: `docker compose --profile ai up -d claude-agent`
4. Test: `curl -X POST http://localhost:3100/run -H "Authorization: Bearer YOUR_KEY" -H "Content-Type: application/json" -d '{"prompt":"create a hello world Express app"}'`

## API Reference

### `POST /run` — Start a job
```json
{
  "prompt": "Refactor the auth module to use JWT",
  "workdir": "/workspace",
  "timeout": 300000,
  "max_turns": 25
}
```
Returns `202 Accepted`:
```json
{ "data": { "jobId": "uuid", "status": "running" } }
```

### `GET /jobs/:id` — Check job status
Returns:
```json
{
  "data": {
    "id": "uuid",
    "status": "running|completed|failed",
    "result": { ... },
    "startedAt": "...",
    "completedAt": "..."
  }
}
```

### `GET /jobs` — List all jobs
### `GET /health` — Health check

## Integration with n8n
Create an n8n workflow:
1. HTTP Request node → `POST http://claude-agent:3100/run` with prompt
2. Wait node → 30 seconds
3. HTTP Request node → `GET http://claude-agent:3100/jobs/{{ $json.data.jobId }}`
4. IF node → check `status === "completed"`

## Security
- All endpoints require `Authorization: Bearer CLAUDE_AGENT_API_KEY`
- The `/workspace` volume persists files between jobs
- Jobs run with the container's permissions (no host access)
