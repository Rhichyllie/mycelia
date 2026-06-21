import {
  context,
  trace,
  type Attributes,
  type Span,
  type SpanOptions,
} from "@opentelemetry/api";

export type WithTelemetrySpanInput = {
  attributes?: Attributes;
  options?: SpanOptions;
};

export type WithTelemetrySpanRuntime = {
  tracerName?: string;
  tracerVersion?: string;
  ensureStarted?: () => void;
};

export function setTelemetryAttributes(
  span: Span,
  attributes?: Attributes,
): void {
  if (!attributes) {
    return;
  }

  span.setAttributes(attributes);
}

export function addTelemetryEvent(
  span: Span,
  name: string,
  attributes?: Attributes,
): void {
  span.addEvent(name, attributes);
}

export async function withTelemetrySpan<T>(
  name: string,
  input: WithTelemetrySpanInput,
  run: (span: Span) => Promise<T> | T,
  runtime: WithTelemetrySpanRuntime = {},
): Promise<T> {
  runtime.ensureStarted?.();
  const tracer = trace.getTracer(
    runtime.tracerName ?? "mycelia",
    runtime.tracerVersion,
  );
  const span = tracer.startSpan(name, {
    ...input.options,
    attributes: {
      ...input.options?.attributes,
      ...input.attributes,
    },
  });

  try {
    return await context.with(trace.setSpan(context.active(), span), () =>
      run(span),
    );
  } catch (error) {
    span.recordException(error as Error);
    throw error;
  } finally {
    span.end();
  }
}
