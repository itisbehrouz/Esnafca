import { NextResponse } from "next/server";
import { type ZodError } from "zod";

/**
 * RFC 7807 Problem Details for HTTP APIs
 * Standardized error structure across Achord Platform services.
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  invalidParams?: Array<{
    name: string;
    reason: string;
  }>;
  [key: string]: any;
}

export function createProblemResponse(
  problem: ProblemDetails,
  headers: HeadersInit = {}
): NextResponse {
  return NextResponse.json(problem, {
    status: problem.status,
    headers: {
      "Content-Type": "application/problem+json",
      ...headers,
    },
  });
}

export function badRequestProblem(
  detail: string,
  invalidParams?: Array<{ name: string; reason: string }>,
  instance?: string
): NextResponse {
  return createProblemResponse({
    type: "https://achord.io/errors/bad-request",
    title: "Geçersiz İstek (Bad Request)",
    status: 400,
    detail,
    instance,
    invalidParams,
  });
}

export function unauthorizedProblem(
  detail = "Bu işlem için yönetici yetkisi gereklidir.",
  instance?: string
): NextResponse {
  return createProblemResponse({
    type: "https://achord.io/errors/unauthorized",
    title: "Yetkisiz Erişim (Unauthorized)",
    status: 401,
    detail,
    instance,
  });
}

export function forbiddenProblem(
  detail = "Bu kaynağa erişim yetkiniz bulunmuyor.",
  instance?: string
): NextResponse {
  return createProblemResponse({
    type: "https://achord.io/errors/forbidden",
    title: "Erişim Engellendi (Forbidden)",
    status: 403,
    detail,
    instance,
  });
}

export function notFoundProblem(
  detail = "Talep edilen kaynak bulunamadı.",
  instance?: string
): NextResponse {
  return createProblemResponse({
    type: "https://achord.io/errors/not-found",
    title: "Kayıt Bulunamadı (Not Found)",
    status: 404,
    detail,
    instance,
  });
}

export function zodProblem(
  zodError: ZodError,
  instance?: string,
  detail = "Gönderilen parametreler şema doğrulamasından geçemedi."
): NextResponse {
  const invalidParams = zodError.issues.map((issue) => ({
    name: issue.path.join("."),
    reason: issue.message,
  }));

  return createProblemResponse({
    type: "https://achord.io/errors/validation-error",
    title: "Doğrulama Hatası (Validation Error)",
    status: 422,
    detail,
    instance,
    invalidParams,
  });
}

export function internalErrorProblem(
  detail = "Sunucu üzerinde beklenmeyen bir hata oluştu.",
  instance?: string
): NextResponse {
  return createProblemResponse({
    type: "https://achord.io/errors/internal-server-error",
    title: "Sunucu Hatası (Internal Server Error)",
    status: 500,
    detail,
    instance,
  });
}
