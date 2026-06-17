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
