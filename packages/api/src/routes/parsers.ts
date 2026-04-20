/**
 * Python Parser Service Routes
 * Integrates structured-data-parser as a microservice
 * 
 * Python service runs in Docker and exposes REST endpoints
 * This route proxies requests to the Python parser service
 */

import { Router } from "express";
import { success, badRequest, error } from "../helpers/response.js";
import type { AuthenticatedRequest } from "../types.js";

// Python parser service URL (runs in Docker)
const PARSER_SERVICE_URL = process.env.PARSER_SERVICE_URL || "http://parser-api:12001";
const PARSER_API_KEY = process.env.PARSER_API_KEY || "";

/**
 * Proxy helper - forwards request to Python service
 */
async function proxyToParser(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any
): Promise<any> {
  const url = `${PARSER_SERVICE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (PARSER_API_KEY) {
    headers["X-API-Key"] = PARSER_API_KEY;
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  } catch (err) {
    throw new Error(`Parser service unavailable: ${err}`);
  }
}

export function parsersRouter(): Router {
  const router = Router();

  // ══════════════════════════════════════════════
  // Health Check
  // ══════════════════════════════════════════════

  // Parser service health
  router.get("/parsers/health", async (_req, res, next) => {
    try {
      const data = await proxyToParser("/health");
      success(res, data);
    } catch (err) {
      error(res, "Parser service unavailable", 503);
    }
  });

  // List available parsers
  router.get("/parsers", async (_req, res, next) => {
    try {
      const data = await proxyToParser("/parsers");
      success(res, data);
    } catch (err) {
      error(res, "Failed to list parsers", 503);
    }
  });

  // ══════════════════════════════════════════════
  // Airtable Parser
  // ══════════════════════════════════════════════

  // List Airtable bases
  router.get("/parsers/airtable/bases", async (_req, res, next) => {
    try {
      const data = await proxyToParser("/airtable/bases");
      success(res, data);
    } catch (err) {
      next(err);
    }
  });

  // Fetch Airtable records
  router.post("/parsers/airtable/records", async (req, res, next) => {
    try {
      const { base_id, table, fields, formula } = req.body;
      if (!base_id || !table) {
        return badRequest(res, "base_id and table are required");
      }
      const data = await proxyToParser("/airtable/records", "POST", {
        base_id,
        table,
        fields,
        formula,
      });
      success(res, data);
    } catch (err) {
      next(err);
    }
  });

  // ══════════════════════════════════════════════
  // Notion Parser
  // ══════════════════════════════════════════════

  // Get Notion database schema
  router.get("/parsers/notion/schema/:databaseId", async (req, res, next) => {
    try {
      const { databaseId } = req.params;
      const data = await proxyToParser(`/notion/schema/${databaseId}`);
      success(res, data);
    } catch (err) {
      next(err);
    }
  });

  // Query Notion database
  router.post("/parsers/notion/query", async (req, res, next) => {
    try {
      const { database_id, filter, sorts } = req.body;
      if (!database_id) {
        return badRequest(res, "database_id is required");
      }
      const data = await proxyToParser("/notion/query", "POST", {
        database_id,
        filter,
        sorts,
      });
      success(res, data);
    } catch (err) {
      next(err);
    }
  });

  // ══════════════════════════════════════════════
  // Excel/Google Sheets Parser
  // ══════════════════════════════════════════════

  // Parse Excel from URL
  router.post("/parsers/excel/parse", async (req, res, next) => {
    try {
      const { url, sheet, skip_rows } = req.body;
      if (!url) {
        return badRequest(res, "url is required");
      }
      const data = await proxyToParser("/excel/parse", "POST", {
        url,
        sheet,
        skip_rows,
      });
      success(res, data);
    } catch (err) {
      next(err);
    }
  });

  // Parse Google Sheet
  router.post("/parsers/google-sheets/parse", async (req, res, next) => {
    try {
      const { spreadsheet_id, sheet_name } = req.body;
      if (!spreadsheet_id) {
        return badRequest(res, "spreadsheet_id is required");
      }
      const data = await proxyToParser("/google-sheets/parse", "POST", {
        spreadsheet_id,
        sheet_name,
      });
      success(res, data);
    } catch (err) {
      next(err);
    }
  });

  // ══════════════════════════════════════════════
  // GitHub Parser
  // ══════════════════════════════════════════════

  // Get repository info
  router.get("/parsers/github/repo/:owner/:repo", async (req, res, next) => {
    try {
      const { owner, repo } = req.params;
      const data = await proxyToParser(`/github/repo/${owner}/${repo}`);
      success(res, data);
    } catch (err) {
      next(err);
    }
  });

  // Fetch GitHub issues
  router.get("/parsers/github/issues/:owner/:repo", async (req, res, next) => {
    try {
      const { owner, repo } = req.params;
      const { state = "open" } = req.query;
      const data = await proxyToParser(
        `/github/issues/${owner}/${repo}?state=${state}`
      );
      success(res, data);
    } catch (err) {
      next(err);
    }
  });

  // Fetch GitHub releases
  router.get("/parsers/github/releases/:owner/:repo", async (req, res, next) => {
    try {
      const { owner, repo } = req.params;
      const data = await proxyToParser(`/github/releases/${owner}/${repo}`);
      success(res, data);
    } catch (err) {
      next(err);
    }
  });

  // ══════════════════════════════════════════════
  // Wikipedia Parser
  // ══════════════════════════════════════════════

  // Parse Wikipedia article
  router.post("/parsers/wikipedia/parse", async (req, res, next) => {
    try {
      const { title, section } = req.body;
      if (!title) {
        return badRequest(res, "title is required");
      }
      const data = await proxyToParser("/wikipedia/parse", "POST", {
        title,
        section,
      });
      success(res, data);
    } catch (err) {
      next(err);
    }
  });

  // Get Wikipedia tables
  router.get("/parsers/wikipedia/tables/:title", async (req, res, next) => {
    try {
      const { title } = req.params;
      const data = await proxyToParser(`/wikipedia/tables/${title}`);
      success(res, data);
    } catch (err) {
      next(err);
    }
  });

  // ══════════════════════════════════════════════
  // Wikidata Parser
  // ══════════════════════════════════════════════

  // Query Wikidata (SPARQL)
  router.post("/parsers/wikidata/query", async (req, res, next) => {
    try {
      const { query } = req.body;
      if (!query) {
        return badRequest(res, "SPARQL query is required");
      }
      const data = await proxyToParser("/wikidata/query", "POST", { query });
      success(res, data);
    } catch (err) {
      next(err);
    }
  });

  // Get Wikidata entity
  router.get("/parsers/wikidata/entity/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await proxyToParser(`/wikidata/entity/${id}`);
      success(res, data);
    } catch (err) {
      next(err);
    }
  });

  // ══════════════════════════════════════════════
  // WordPress Parser
  // ══════════════════════════════════════════════

  // Fetch WordPress posts
  router.get("/parsers/wordpress/posts", async (req, res, next) => {
    try {
      const { site_url, per_page = 10 } = req.query;
      if (!site_url) {
        return badRequest(res, "site_url is required");
      }
      const data = await proxyToParser(
        `/wordpress/posts?site_url=${site_url}&per_page=${per_page}`
      );
      success(res, data);
    } catch (err) {
      next(err);
    }
  });

  // Fetch WordPress pages
  router.get("/parsers/wordpress/pages", async (req, res, next) => {
    try {
      const { site_url, per_page = 10 } = req.query;
      if (!site_url) {
        return badRequest(res, "site_url is required");
      }
      const data = await proxyToParser(
        `/wordpress/pages?site_url=${site_url}&per_page=${per_page}`
      );
      success(res, data);
    } catch (err) {
      next(err);
    }
  });

  // ══════════════════════════════════════════════
  // HTML/PDF Table Parsers
  // ══════════════════════════════════════════════

  // Parse tables from URL
  router.post("/parsers/html/tables", async (req, res, next) => {
    try {
      const { url, selector } = req.body;
      if (!url) {
        return badRequest(res, "url is required");
      }
      const data = await proxyToParser("/html/tables", "POST", { url, selector });
      success(res, data);
    } catch (err) {
      next(err);
    }
  });

  // Parse tables from PDF
  router.post("/parsers/pdf/tables", async (req, res, next) => {
    try {
      const { url } = req.body;
      if (!url) {
        return badRequest(res, "url is required");
      }
      const data = await proxyToParser("/pdf/tables", "POST", { url });
      success(res, data);
    } catch (err) {
      next(err);
    }
  });

  // ══════════════════════════════════════════════
  // Markdown Parser
  // ══════════════════════════════════════════════

  // Parse markdown tables
  router.post("/parsers/markdown/tables", async (req, res, next) => {
    try {
      const { content, url } = req.body;
      if (!content && !url) {
        return badRequest(res, "content or url is required");
      }
      const data = await proxyToParser("/markdown/tables", "POST", {
        content,
        url,
      });
      success(res, data);
    } catch (err) {
      next(err);
    }
  });

  return router;
}