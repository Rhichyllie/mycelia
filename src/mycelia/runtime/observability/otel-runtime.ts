export type ServerOpenTelemetryRuntime = {
  started: boolean;
};

const runtime: ServerOpenTelemetryRuntime = {
  started: false,
};

export function ensureServerOpenTelemetryRuntimeStarted(): {
  runtime: ServerOpenTelemetryRuntime;
} {
  runtime.started = true;
  return { runtime };
}

export function resetServerOpenTelemetryRuntimeForTests() {
  runtime.started = false;
}
