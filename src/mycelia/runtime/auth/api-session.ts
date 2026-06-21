import { getServerSession } from "next-auth";

import { AppError } from "../../lib/app-error";
import { assertAuthRuntimeReady } from "./auth-runtime";
import {
  isRecoverableSessionAuthError,
  requireSessionActor,
} from "./session";
import { getAuthOptions } from "./options";
import {
  addServerTelemetryEvent,
  setServerTelemetryAttributes,
  withServerTelemetrySpan,
} from "../observability/server-telemetry";

function unauthorizedError(message = "Autenticacao necessaria.") {
  return new AppError(message, {
    code: "UNAUTHORIZED",
    status: 401,
  });
}

export async function getApiSessionIdentity() {
  assertAuthRuntimeReady();

  return await withServerTelemetrySpan(
    "auth.session.api_identity",
    {
      attributes: {
        "auth.session.required": false,
        "auth.session.source": "api",
      },
    },
    async (span) => {
      try {
        const session = await getServerSession(getAuthOptions());
        setServerTelemetryAttributes(span, {
          "auth.session.present": Boolean(session),
        });

        if (!session) {
          addServerTelemetryEvent(span, "auth.session.missing");
          return null;
        }

        const actor = await requireSessionActor(session);
        addServerTelemetryEvent(span, "auth.session.identity_resolved", {
          "auth.identity.present": true,
        });

        return {
          session,
          actor,
          userId: actor.userId,
          identity: actor.email,
        };
      } catch (error) {
        if (isRecoverableSessionAuthError(error)) {
          addServerTelemetryEvent(span, "auth.session.invalid", {
            "auth.session.error_code": error.code,
          });
          return null;
        }

        throw error;
      }
    },
  );
}

export async function requireApiSessionIdentity() {
  const auth = await getApiSessionIdentity();

  if (!auth) {
    throw unauthorizedError();
  }

  return auth;
}

