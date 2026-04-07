import { Router } from "express";
import type { Pool } from "pg";
import { success, notFound, badRequest } from "../helpers/response.js";
import { parsePagination } from "../helpers/pagination.js";
import type { AuthenticatedRequest } from "../types.js";

export function usersRouter(db: Pool) {
  const router = Router();

  // POST /api/v1/users — create user
  router.post("/", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { email, name, external_id } = req.body;
      if (!email || !name) return badRequest(res, "email and name are required");

      const result = await db.query(
        `INSERT INTO users (email, name, external_id) VALUES ($1, $2, $3) RETURNING *`,
        [email, name, external_id || null]
      );
      success(res, { data: result.rows[0], status: 201 });
    } catch (err: any) {
      if (err.constraint === "users_email_key") return badRequest(res, "Email already registered");
      next(err);
    }
  });

  // GET /api/v1/users — list users
  router.get("/", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { page, limit, offset } = parsePagination(req);
      const conditions: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (req.query.email) { conditions.push(`email ILIKE $${idx++}`); params.push(`%${req.query.email}%`); }

      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
      const countResult = await db.query(`SELECT COUNT(*) FROM users ${where}`, params);
      const total = parseInt(countResult.rows[0].count);

      const dataResult = await db.query(
        `SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
        [...params, limit, offset]
      );
      success(res, { data: dataResult.rows, meta: { page, limit, total } });
    } catch (err) { next(err); }
  });

  // GET /api/v1/users/:id — get user
  router.get("/:id", async (req, res, next) => {
    try {
      const result = await db.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
      if (result.rows.length === 0) return notFound(res, "User");
      success(res, { data: result.rows[0] });
    } catch (err) { next(err); }
  });

  // PATCH /api/v1/users/:id — update user
  router.patch("/:id", async (req, res, next) => {
    try {
      const { name, avatar_url, email_verified } = req.body;
      const sets: string[] = ["updated_at = NOW()"];
      const params: any[] = [];
      let idx = 1;

      if (name !== undefined) { sets.push(`name = $${idx++}`); params.push(name); }
      if (avatar_url !== undefined) { sets.push(`avatar_url = $${idx++}`); params.push(avatar_url); }
      if (email_verified !== undefined) { sets.push(`email_verified = $${idx++}`); params.push(email_verified); }

      params.push(req.params.id);
      const result = await db.query(
        `UPDATE users SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`, params
      );
      if (result.rows.length === 0) return notFound(res, "User");
      success(res, { data: result.rows[0] });
    } catch (err) { next(err); }
  });

  return router;
}
