import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const HOST = "127.0.0.1";
const DEFAULT_PORT = 3000;
const requestedPort =
  process.env.MYCELIA_DEMO_LOCAL_PORT ?? process.env.PORT ?? `${DEFAULT_PORT}`;

function resolvePort() {
  if (!/^\d+$/u.test(requestedPort)) {
    console.error(
      "MYCELIA local demo preview refused to start: port must be numeric.",
    );
    process.exit(1);
  }

  const parsed = Number(requestedPort);

  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 65535) {
    console.error(
      "MYCELIA local demo preview refused to start: port is out of range.",
    );
    process.exit(1);
  }

  return String(parsed);
}

function resolveNextCliPath() {
  const cliPath = join(process.cwd(), "node_modules", "next", "dist", "bin", "next");

  if (!existsSync(cliPath)) {
    console.error(
      "MYCELIA local demo preview refused to start: local Next CLI was not found.",
    );
    process.exit(1);
  }

  return cliPath;
}

const PORT = resolvePort();

const urls = [
  `http://${HOST}:${PORT}/mycelia`,
  `http://${HOST}:${PORT}/mycelia/demo`,
  `http://${HOST}:${PORT}/mycelia/request/new`,
  `http://${HOST}:${PORT}/mycelia/approval/decision`,
  `http://${HOST}:${PORT}/mycelia/investigation`,
];

console.log("MYCELIA local demo preview");
console.log("Status: non-production read-only demo inspection.");
console.log(`Host: ${HOST}`);
console.log(`Port: ${PORT}`);
console.log(
  "Safety: no runtime execution, writes, API, auth, replay, export or external service call.",
);
console.log("Open these local URLs:");

for (const url of urls) {
  console.log(`- ${url}`);
}

const command = process.execPath;
const args = [
  resolveNextCliPath(),
  "dev",
  "--hostname",
  HOST,
  "--port",
  PORT,
];

const child = spawn(command, args, {
  cwd: process.cwd(),
  env: {
    ...process.env,
    MYCELIA_LOCAL_DEMO_PREVIEW: "1",
    NEXT_TELEMETRY_DISABLED: "1",
  },
  stdio: "inherit",
  shell: false,
  windowsHide: true,
});

child.on("error", (error) => {
  console.error("MYCELIA local demo preview failed to start.");
  console.error(error.message);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(0);
  }

  process.exit(code ?? 0);
});

const stopChild = () => {
  if (!child.killed) {
    child.kill("SIGTERM");
  }
};

process.on("SIGINT", stopChild);
process.on("SIGTERM", stopChild);
