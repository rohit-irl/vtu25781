# Stage 1
a REST api for notifications,
## endpoints

### GET /notifications
gets all notifications for the logged in user. can filter with query params like `?unread=true` or `?limit=20`
example request:
`GET /notifications?unread=true`
response would look something like:

```json
{
  "notifications": [
    {
      "id": "notif_123",
      "title": "Assignment due tomorrow",
      "message": "CS101 homework is due June 18",
      "read": false,
      "createdAt": "2026-06-17T10:00:00Z"
    }
  ],
  "total": 1
}
```

### PATCH /notifications/:id/read
if you mark one notification as read. id goes in the url
`PATCH /notifications/notif_123/read`
body:
```json
{ "read": true }
```
returns the updated notification back, probably just `read: true`

### DELETE /notifications/:id
removes a notification
`DELETE /notifications/notif_123`
no body required. server will return 204 or like `{ "deleted": true }`

## real-time stuff (optional)
for live updates we use SSE or WebSocket instead of polling GET every second
SSE is easier, client opens `GET /notifications/stream` and server pushes events. only one way
WebSocket (`/notifications/ws`)
quick sse event example:
```json
{
  "type": "notification.created",
  "notification": { "id": "notif_124", "title": "New grade posted", "read": false }
}
```

## Stage 2
going with SQL (postgres). notifications have a clear structure and we need filtering by user and read status

### notifications table
```
notifications
-----------
id          UID PRIMARY KEY
user_id     UID NOT NULL
title       VARCHAR(255)
message     TEXT
read        BOOLEAN DEFAULT false
created_at  TIMESTAMP
read_at     TIMESTAMP NULL
```
index on (user_id, created_at). maybe (user_id, read) also for the unread filter

### problems when data grows
- table gets huge if we never delete old notifications, queries get slow down
- lots of users trying GET at once = db gets overloaded
- marking read one at a time works for now but could be slow with more users (bulk update later)

### queries
fetch (GET /notifications):
```sql
SELECT id, title, message, read, created_at
FROM notifications
WHERE user_id = $1
  AND ($2::boolean IS NULL OR read = $2)
ORDER BY created_at DESC
LIMIT $3;
```

mark read (PATCH):
```sql
UPDATE notifications
SET read = true, read_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING id, read, read_at;
```

delete (DELETE):
```sql
DELETE FROM notifications
WHERE id = $1 AND user_id = $2;
```