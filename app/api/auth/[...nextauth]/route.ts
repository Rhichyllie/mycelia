import NextAuth from "next-auth";

import { AppError, isAppError } from "../../../../src/mycelia/lib/app-error";
import {
  getAuthCallbackErrorMessage,
  getAuthCallbackErrorStatus,
  isAuthCallbackErrorCode,
} from "../../../../src/mycelia/runtime/auth/auth-callback-error";
import { assertAuthRuntimeReady } from "../../../../src/mycelia/runtime/auth/auth-runtime";
import { getAuthOptions } from "../../../../src/mycelia/runtime/auth/options";
import { appRoutes } from "../../../../src/mycelia/runtime/auth/routes";

export const runtime = "nodejs";

type NextAuthAppRouteHandler = (
  request: Request,
  context: unknown,
) => Promise<Response> | Response;

function errorResponse(error: AppError): Response {
  return Response.json(
    {
      error: error.code,
      code: error.code,
      message: error.message,
      ...(error.details ?? {}),
    },
    { status: error.status },
  );
}

function callbackErrorPayload(code: string, url: string): Response | null {
  if (!isAuthCallbackErrorCode(code)) {
    return null;
  }

  return Response.json(
    {
      code,
      message: getAuthCallbackErrorMessage(code),
      url,
    },
    { status: getAuthCallbackErrorStatus(code) },
  );
}

function callbackErrorRedirect(location: string): Response | null {
  let parsedLocation: URL;

  try {
    parsedLocation = new URL(location);
  } catch {
    return null;
  }

  const code = parsedLocation.searchParams.get("error");

  if (!isAuthCallbackErrorCode(code)) {
    return null;
  }

  const rewritten = new URL(appRoutes.login, parsedLocation.origin);
  rewritten.searchParams.set("error", code);

  return new Response(null, {
    status: 302,
    headers: { location: rewritten.toString() },
  });
}

async function rewriteKnownCallbackFailure(response: Response): Promise<Response> {
  const location = response.headers.get("location");

  if (location !== null) {
    return callbackErrorRedirect(location) ?? response;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return response;
  }

  try {
    const payload = (await response.clone().json()) as { url?: unknown };

    if (typeof payload.url !== "string") {
      return response;
    }

    const parsedUrl = new URL(payload.url);
    const code = parsedUrl.searchParams.get("error");

    return callbackErrorPayload(code ?? "", payload.url) ?? response;
  } catch {
    return response;
  }
}

async function authRouteHandler(
  request: Request,
  context: unknown,
): Promise<Response> {
  try {
    assertAuthRuntimeReady();
    const handler = NextAuth(getAuthOptions()) as NextAuthAppRouteHandler;
    const response = await handler(request, context);

    return await rewriteKnownCallbackFailure(response);
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error);
    }

    throw error;
  }
}

export const GET = authRouteHandler;
export const POST = authRouteHandler;

