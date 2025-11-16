# DGA mToken Demo

This project is a small demo application that simulates how to connect to the **DGA APIs** in order to obtain and use **mToken** values inside a web application.

The typical flow is:

1. Use **Postman** (or another REST client) to call the DGA endpoints and obtain:
   - `appId`
   - `mToken`
2. Open this demo application in the browser and pass those values through the URL query string.
3. The app reads `appId` and `mToken` from the URL, calls the backend API (`/api/dga`), and then shows the processed user data.

---

## Example URL

Once the app is running, you can test it by opening a URL like this:

http://localhost:3005/?appId=yourAppId&mToken=yourMToken

# Install dependencies
npm install

# Run the dev server
npm run dev

# .env
```text
# ---- Postgres / Prisma ----
DATABASE_URL="your-prisma-or-postgres-connection-string"

# ---- DGA Keys ----
CONSUMER_KEY="your-dga-consumer-key"
CONSUMER_SECRET="your-dga-consumer-secret"
AGENT_ID="your-dga-agent-id"

# ---- Next / Server ----
PORT=3005
NODE_ENV=production




