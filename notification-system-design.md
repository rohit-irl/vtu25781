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

## Stage 3
### slow query
```sql
SELECT * FROM notifications
WHERE studentID = 1042
  AND isRead = false
ORDER BY createdAt ASC;
```

why its slow:
1. `SELECT *` fetches everything even if you dont need it
2. no index on studentID + isRead so db scans and sorts in memory
3. `ORDER BY createdAt ASC` without index = extra work

### optimized version
```sql
SELECT id, title, message, createdAt
FROM notifications
WHERE studentID = 1042
  AND isRead = false
ORDER BY createdAt ASC
LIMIT 50;
```
and add index like:
```sql
CREATE INDEX idx_notif_student_unread
ON notifications (studentID, createdAt)
WHERE isRead = false;
```
partial because we mostly query unread anyway

### indexes on every column?
indexes slow down inserts and updates, waste disk space, and confuse the query planner. just index what you actually filter on

### placement notifications last 7 days
find all students who got a placement notification:
```sql
SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement'
  AND createdAt >= NOW() - INTERVAL '7 days';
```
returns unique studentIDs, add GROUP BY if you need counts per student

## Stage 4
problem: we fetch notifications on every page load and the db is getting slow

### 1. caching with redis
cache each user's notification list in redis, key like `notifs:user:1042`.when a new notification comes in, clear the cache so next request gets fresh data
tradeoffs:
- reads are much faster, db gets less traffic
- cache can show old data if not cleared properly, also need to run redis separately

### 2. pagination (enforce the limit)
we already have `?limit=20` on GET but nobody enforces it. just cap it server side — max 20-50 per request
tradeoffs:
- easy win, less data per query
- still hits db on every page load, just smaller amount

### 3. poll less / use SSE instead
stop calling GET on every page load. use the SSE stream from stage 1 so server sends data only when something new happens. or just poll every 30-60s instead of every load
tradeoffs:
- way fewer db calls
- SSE keeps connection open which uses more server memory, polling still hits db just less

## Stage 5
problem: HR clicks "Notify All" and 50k students need 
email + in-app notification at once
current approach (not good):
```
for each student in students:
  send_email(student)
  save_to_db(student)
  push_to_app(student)
```

### whats wrong
- runs 50k times one by one, server get hang
- if email fails at student 800, no way to know who got it, no retry
- email apis have rate limits, will break midway

### fix — use a queue
HR clicks notify, api just adds jobs to a queue and returns immediately. worker runs in background, handles batches of 100, retries failed emails a few times
if still fails after retries, log it somewhere to check later

### db and email together or separate?
separate. save in-app notif to db first, then send email as its own job
if email fails, at least in-app notif is there. dont tie them together

### better pseudocode
```
onNotifyAll(message):
students = getAllStudents()
for batch in chunks(students, 100):
queue.add('notify-batch', { studentIds: batch, message })

onJob('notify-batch', { studentIds, message }):
for studentId in studentIds:
save_to_db(studentId, message)
queue.add('send-email', { studentId, message }, { retries: 3 })

onJob('send-email', { studentId, message }):
send_email(studentId, message)
push_to_app(studentId, message)
```
api returns fast, failures get retried, no data lost