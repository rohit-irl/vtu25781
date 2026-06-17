const URL = "http://4.224.186.213/evaluation-service/notifications";

function typeWeight(type) {
  if (!type) return 0;
  const t = String(type).toLowerCase();
  if (t === "placement") return 3;
  if (t === "result") return 2;
  if (t === "event") return 1;
  return 0;
}

function truncate(str, max) {
  if (!str) return "";
  return str.length <= max ? str : str.slice(0, max - 3) + "...";
}

async function main() {
  const token = process.env.EVALUATION_TOKEN;
  if (!token) {
    console.error("Set EVALUATION_TOKEN before running this script.");
    process.exit(1);
  }

  const res = await fetch(URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    console.error("Failed to fetch notifications:", res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  const notifications = data.notifications || [];
  if (!Array.isArray(notifications) || notifications.length === 0) {
    console.log("No notifications.");
    return;
  }

  const sorted = [...notifications].sort((a, b) => {
    const wDiff = typeWeight(b.Type) - typeWeight(a.Type);
    if (wDiff !== 0) return wDiff;
    return String(b.Timestamp || "").localeCompare(String(a.Timestamp || ""));
  });
  console.log("Top 10 priority notifications:");
  sorted.slice(0, 10).forEach((n, i) => {
    console.log(
      `${i + 1}. type=${n.Type} | time=${n.Timestamp} | id=${n.ID} | msg=${truncate(
        n.Message,
        80
      )}`
    );
  });
}
main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});

