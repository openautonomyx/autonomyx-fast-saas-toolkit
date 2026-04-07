# Ollama — Local LLM Runtime

## URL
`models.DOMAIN` (API endpoint)

## Post-Setup Steps
1. Pull your first model: `docker compose exec ollama ollama pull llama3.2`
2. Test: `curl http://localhost:11434/api/generate -d '{"model":"llama3.2","prompt":"hello"}'`
3. LibreChat and Langflow are pre-configured to connect to Ollama automatically

## Popular Models
```bash
docker compose exec ollama ollama pull llama3.2      # 3B params, fast
docker compose exec ollama ollama pull mistral        # 7B params, balanced
docker compose exec ollama ollama pull codellama      # 7B params, coding
docker compose exec ollama ollama pull gemma2         # 9B params, Google
docker compose exec ollama ollama pull phi3           # 3.8B params, Microsoft
```

## GPU Acceleration
For NVIDIA GPUs, uncomment the GPU block in `docker-compose.yml`:
```yaml
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: all
          capabilities: [gpu]
```
Requires `nvidia-container-toolkit` on the host.

## Resource Notes
- CPU inference: ~8 GB RAM for 7B models, ~16 GB for 13B
- Models stored in `ollama-data` volume (~4 GB per 7B model)
- First inference is slow (model loading); subsequent are fast (cached)
