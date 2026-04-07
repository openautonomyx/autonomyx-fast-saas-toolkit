import type { Response } from "express";

interface SuccessOptions {
  data: unknown;
  meta?: { page?: number; limit?: number; total?: number };
  status?: number;
}

interface ErrorOptions {
  code: string;
  message: string;
  status: number;
}

export function success(res: Response, opts: SuccessOptions) {
  res.status(opts.status || 200).json({
    data: opts.data,
    meta: opts.meta || null,
    error: null,
  });
}

export function error(res: Response, opts: ErrorOptions) {
  res.status(opts.status).json({
    data: null,
    error: { code: opts.code, message: opts.message },
  });
}

export function notFound(res: Response, resource: string) {
  error(res, { code: "NOT_FOUND", message: `${resource} not found`, status: 404 });
}

export function forbidden(res: Response, message = "Access denied") {
  error(res, { code: "FORBIDDEN", message, status: 403 });
}

export function badRequest(res: Response, message: string) {
  error(res, { code: "BAD_REQUEST", message, status: 400 });
}
