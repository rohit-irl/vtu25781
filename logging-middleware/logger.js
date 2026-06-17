const DEFAULT_BASE_URL = "http://20.244.56.144/evaluation-service";
const ALLOWED_STACKS = new Set(["backend", "frontend"]);
const ALLOWED_LEVELS = new Set(["debug", "info", "warn", "error", "fatal"]);
const BACKEND_PACKAGES = new Set([
  "cache",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "repository",
  "route",
  "service",
]);

const FRONTEND_PACKAGES = new Set([
  "api",
  "component",
  "hook",
  "page",
  "state",
  "style",
]);

const SHARED_PACKAGES = new Set(["auth", "config", "middleware", "utils"]);

function getAllowedPackagesForStack(stack) {
  const stackPackages = stack === "backend" ? BACKEND_PACKAGES : FRONTEND_PACKAGES;
  return new Set([...stackPackages, ...SHARED_PACKAGES]);
}

function validatePayload(stack, level, pkg, message) {
  if (!ALLOWED_STACKS.has(stack)) {
    throw new Error(`Invalid stack "${stack}". Use "backend" or "frontend".`);
  }
  if (!ALLOWED_LEVELS.has(level)) {
    throw new Error(
      `Invalid level "${level}". Use one of: ${Array.from(ALLOWED_LEVELS).join(", ")}.`
    );
  }

  const allowedPackages = getAllowedPackagesForStack(stack);
  if (!allowedPackages.has(pkg)) {
    throw new Error(`Invalid package "${pkg}" for stack "${stack}".`);
  }
  if (typeof message !== "string" || message.trim() === "") {
    throw new Error("Message must be a non-empty string.");
  }
}

export async function sendLog({
  accessToken,
  stack,
  level,
  packageName,
  message,
  baseUrl = DEFAULT_BASE_URL,
}) {
  if (!accessToken || typeof accessToken !== "string") {
    throw new Error("A valid bearer access token is required.");
  }

  validatePayload(stack, level, packageName, message);
  const response = await fetch(`${baseUrl}/logs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      stack,
      level,
      package: packageName,
      message,
    }),
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    throw new Error(
      `Log API failed (${response.status}): ${payload ? JSON.stringify(payload) : "No response body"}`
    );
  }
  return payload;
}

export function createLogger({ accessToken, baseUrl = DEFAULT_BASE_URL }) {
  return async function Log(stack, level, packageName, message) {
    return sendLog({
      accessToken,
      stack,
      level,
      packageName,
      message,
      baseUrl,
    });
  };
}

export const ALLOWED_STACKS_LIST = Array.from(ALLOWED_STACKS);
export const ALLOWED_LEVELS_LIST = Array.from(ALLOWED_LEVELS);
