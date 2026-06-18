export const MYCELIA_DEMO_DEFAULT_TENANT = "DEMO_TENANT";
export const MYCELIA_DEMO_DEFAULT_APPROVER = "DEMO_APPROVER";

export type MyceliaDemoDatabaseConfig = {
  readonly tenantId: string;
  readonly approverRef: string;
  readonly demoMode: boolean;
};

function textEnv(name: string, fallback: string): string {
  const value = process.env[name]?.trim();

  return value === undefined || value.length === 0 ? fallback : value;
}

function booleanEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();

  if (value === undefined || value.length === 0) {
    return fallback;
  }

  return value === "1" || value === "true" || value === "yes";
}

export function getMyceliaDemoDatabaseConfig(): MyceliaDemoDatabaseConfig {
  return {
    tenantId: textEnv("DEMO_TENANT", MYCELIA_DEMO_DEFAULT_TENANT),
    approverRef: textEnv("DEMO_APPROVER", MYCELIA_DEMO_DEFAULT_APPROVER),
    demoMode: booleanEnv("DEMO_MODE", true),
  };
}
