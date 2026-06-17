import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { fetchNotifications } from "../api/notifications";
import { NotificationCard } from "../components/NotificationCard";

function typeWeight(type) {
  if (!type) return 0;
  const t = String(type).toLowerCase();
  if (t === "placement") return 3;
  if (t === "result") return 2;
  if (t === "event") return 1;
  return 0;
}

function getType(n) {
  return n.Type || n.notificationType;
}

function getTimestamp(n) {
  return n.Timestamp || n.createdAt || "";
}

export function PriorityInboxPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(10);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchNotifications({ limit: 100 });
        if (cancelled) return;
        setNotifications(data.notifications ?? []);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Failed to load notifications.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = [...notifications].sort((a, b) => {
    const wDiff = typeWeight(getType(b)) - typeWeight(getType(a));
    if (wDiff !== 0) return wDiff;
    return String(getTimestamp(b)).localeCompare(String(getTimestamp(a)));
  });

  const top = sorted.slice(0, Number.isFinite(count) ? count : 10);

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 4 }}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Priority Inbox
      </Typography>

      <Box mb={3} display="flex" gap={2} alignItems="center">
        <Typography variant="body2">Show top</Typography>
        <TextField
          size="small"
          type="number"
          inputProps={{ min: 1, max: 100 }}
          value={count}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            setCount(Number.isNaN(n) || n <= 0 ? 10 : n);
          }}
          sx={{ width: 100 }}
        />
        <Typography variant="body2">notifications by priority</Typography>
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error">{error}</Alert>
      )}

      {!loading && !error && top.length === 0 && (
        <Alert severity="info">No notifications available.</Alert>
      )}

      {!loading && !error && top.length > 0 && (
        <Stack spacing={1.5}>
          {top.map((n) => (
            <NotificationCard key={n.ID || n.id} notification={n} />
          ))}
        </Stack>
      )}
    </Box>
  );
}

