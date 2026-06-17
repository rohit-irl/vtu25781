import { useState, useEffect } from "react";
import { fetchNotifications } from "../api/notifications";

export function useNotifications({ page = 1, limit = 10, notificationType } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchNotifications({
          limit,
          page,
          notification_type: notificationType,
        });

        if (cancelled) return;

        const items = data.notifications ?? [];
        const totalCount =
          typeof data.total === "number" ? data.total : items.length;

        setNotifications(items);
        setTotal(totalCount);
        setTotalPages(Math.max(1, Math.ceil(totalCount / limit)));
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Failed to load notifications.");
        setNotifications([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        if (!cancelled) {
          setLoading(false);
      }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [page, limit, notificationType]);

  return { notifications, total, totalPages, loading, error };
}

