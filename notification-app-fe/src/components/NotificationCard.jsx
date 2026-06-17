import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

function getDisplayType(n) {
  return n.Type || n.notificationType || "Notification";
}

function getDisplayTimestamp(n) {
  return n.Timestamp || n.createdAt || "";
}

function getDisplayMessage(n) {
  return n.Message || n.message || "";
}

export function NotificationCard({ notification, isNew }) {
  const type = getDisplayType(notification);
  const timestamp = getDisplayTimestamp(notification);
  const message = getDisplayMessage(notification);

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        borderColor: isNew ? "primary.main" : "divider",
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          mb={0.5}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              label={type}
              color={
                type === "Placement"
                  ? "success"
                  : type === "Result"
                  ? "primary"
                  : "default"
              }
              sx={{ textTransform: "none" }}
            />
            {isNew && (
              <Chip
                size="small"
                label="New"
                color="secondary"
                sx={{ textTransform: "none" }}
              />
            )}
          </Stack>
          {timestamp && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ whiteSpace: "nowrap" }}
            >
              {timestamp}
            </Typography>
          )}
        </Stack>

        <Box mt={0.5}>
          <Typography variant="body2" color="text.primary">
            {message}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

