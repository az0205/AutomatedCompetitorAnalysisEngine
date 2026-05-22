# AutomatedCompetitorAnalysisEngine
A mini-SaaS backend microservice designed to simulate an automated competitor analysis engine. Accepts inbound API requests, checks a PostgreSQL-backed cache layer for existing analysis results, simulates an AI processing workflow for cache misses, and stores generated analysis data for future retrieval.

## API

POST /api/v1/analyze

Request body:
```json
{
  "target_url": "https://example.com",
  "competitor_url": "https://competitor.com",
  "force_refresh": false
}
```
## Local Setup Instructions

### 1. Run the following commands + keep Docker running

 ```bash
   npm install
 ```

```bash
   docker compose up -d
```
   
 ```bash
docker exec -i competitor-postgres psql -U postgres -d competitor_engine < schema.sql
```

### 2. Create these environment variables in .env folder

```env
PORT=3000
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=competitor_engine
```

### 3. Start server

```bash
npm run dev
```

## Critical Thinking & Edge-Case Challenges (Written Questions)

### 1. Concurrency & Race Conditions
If 50 identical POST requests for the exact same target_url hit my webhook endpoint simultaneously at the exact same fraction of a second there is a risk of duplicate AI processing before the cache is populated thus causes running of the AI processes when there may not be a need to. In order to prevent this. To prevent this, I would design the code such that the system processes one request at a time potentially using deduplication mechanism using unique request signatures (which is where I would combine target_url and competitor_url) and enforcing a locking strategy using a dedicated lock table on the PostgreSQL.
This table would store one row per active request signature. When a request arrives, the system would first attempt to insert a new row into this lock table using the request signature as a unique key. If the insert succeeds, that request is now has ownership of the process and is allowed to continue to the AI generation step. If the insert fails due to the unique constraint already existing, it means another request is already processing the same input, so the current request will not trigger AI execution and will instead wait until the result is available in the cache. Once the processing request completes, it stores the generated result in the cache and removes the corresponding entry from the lock table, allowing future requests with the same signature to directly retrieve the cached result. Thus this method prevents my backend from running 50 separate expensive AI processing loops simultaneously.

### 2. Database Failover Design
To prevent users from seeing a raw server crash screen due to the database failover, I would wrap all database calls in try/catch blocks. Then when catching an error, I would make the system send a safe and consistent error response to the client for example:

```json
{
  "error": "Service temporarily unavailable. Please retry later."
}
```
### 3. SaaS Scalability Pricing
Without caching, 100,000 requests per day for the cost of $0.02 per AI execution would result in a total cost of $2000 in cost per day.
With a 35% repeat input rate and an effective cache layer, only 65% of the requests require AI execution so 65,000 requests per day each with the cost of $0.02 results in the total cost per day being $1,300.
Therefore, the total cost saved is 2000 - 1300 = $700 per day
