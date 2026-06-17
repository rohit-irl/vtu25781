## Logging Middleware
Simple reusable logger for the evaluation Log API.

### File
- `logger.js`

### What it does
- Validates `stack`, `level`, `package`, and `message`
- Sends `POST /evaluation-service/logs` with bearer token
- Exposes a reusable `Log(stack, level, packageName, message)` function

### Quick usage
```js
const { createLogger } = require("./logger");
const Log = createLogger({
  accessToken: process.env.LOG_ACCESS_TOKEN,
});
await Log("backend", "error", "handler", "received string, expected bool");
```

### Allowed values
- stack: `backend`, `frontend`
- level: `debug`, `info`, `warn`, `error`, `fatal`
- backend packages: `cache`, `controller`, `cron_job`, `db`, `domain`, `handler`, `repository`, `route`, `service`
- frontend packages: `api`, `component`, `hook`, `page`, `state`, `style`
- shared packages: `auth`, `config`, `middleware`, `utils`
