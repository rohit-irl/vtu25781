import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Box,
  CircularProgress,
  Divider,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";

import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { useNotifications } from "../hooks/useNotifications";

const VIEWED_KEY = "viewedNotificationIds";

function getNotificationId(n) {
  return n.ID || n.id;
}

export function NotificationsPage() {
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);

  const [viewedIds, setViewedIds] = useState(() => {
    try {
      const raw = localStorage.getItem(VIEWED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const { notifications, totalPages, loading, error } = useNotifications({
    page,
    limit: 10,
    notificationType: filter === "All" ? undefined : filter,
  });

  useEffect(() => {
    if (!notifications.length) return;

    const next = new Set(viewedIds);
    notifications.forEach((n) => {
      const id = getNotificationId(n);
      if (id) next.add(id);
    });
    const updated = Array.from(next);
    if (updated.length === viewedIds.length) return;

    setViewedIds(updated);
    try {
      localStorage.setItem(VIEWED_KEY, JSON.stringify(updated));
    } catch {
    }
  }, [notifications, viewedIds]);

  const unreadCount = notifications.filter((n) => {
    const id = getNotificationId(n);
    return id && !viewedIds.includes(id);
  }).length;

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handlePageChange = (_, newPage) => {
    setPage(newPage);
  };

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <Badge badgeContent={unreadCount} color="primary" max={99}>
          <NotificationsIcon sx={{ fontSize: 28 }} />
        </Badge>
        <Typography variant="h5" fontWeight={700}>
          Notifications
        </Typography>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ marginBottom: 3 }}>
        <NotificationFilter value={filter} onChange={handleFilterChange} />
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error">Failed to load notifications: {error}</Alert>
      )}

      {!loading && !error && notifications.length === 0 && (
        <Alert severity="info">No notifications to display.</Alert>
      )}

      {!loading && !error && notifications.length > 0 && (
        <Stack spacing={1.5}>
          {notifications.map((n) => (
            <NotificationCard
              key={getNotificationId(n)}
              notification={n}
              isNew={
                !!getNotificationId(n) &&
                !viewedIds.includes(getNotificationId(n))
              }
            />
          ))}
        </Stack>
      )}

      {!loading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Box>
  );
}
