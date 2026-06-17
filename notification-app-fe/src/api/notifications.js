const BASE_URL = "http://4.224.186.213/evaluation-service/notifications";

import { createLogger } from "../../../logging-middleware/logger.js";

const logAccessToken =
  import.meta.env.VITE_LOG_ACCESS_TOKEN || import.meta.env.VITE_ACCESS_TOKEN;

const Log =
  createLogger && logAccessToken
    ? createLogger({
        accessToken: logAccessToken,
      })
    : null;

function typeSafeToString(value) {
  return value == null ? "" : String(value);
}

export async function fetchNotifications(options = {}) {
  const { limit, page, notification_type } = options;

  const token = import.meta.env.VITE_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Missing VITE_ACCESS_TOKEN for notifications API.");
  }

  const params = new URLSearchParams();
  if (limit != null) params.set("limit", String(limit));
  if (page != null) params.set("page", String(page));
  if (notification_type) params.set("notification_type", notification_type);

  const url = params.toString() ? `${BASE_URL}?${params.toString()}` : BASE_URL;

  if (Log) {
    try {
      await Log(
        "frontend",
        "info",
        "api",
        `Fetching notifications: ${url} (limit=${typeSafeToString(
          limit
        )}, page=${typeSafeToString(page)}, type=${typeSafeToString(
          notification_type
        )})`
      );
    } catch {
    }
  }

  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
  } catch (err) {
    if (Log) {
      try {
        await Log(
          "frontend",
          "error",
          "api",
          `Network error fetching notifications: ${err.message}`
        );
      } catch {
      }
    }
    throw err;
  }

  if (!response.ok) {
    const text = await response.text();
    if (Log) {
      try {
        await Log(
          "frontend",
          "error",
          "api",
          `HTTP ${response.status} fetching notifications: ${text}`
        );
      } catch {
      }
    }
    throw new Error(
      `Failed to fetch notifications (status ${response.status}).`
    );
  }

  const data = await response.json();
  return data;
}

