# ESG Assessment Backend

Minimal backend scaffold for a small ESG assessment web app using Node.js, Express, Prisma, SQLite, and JWT auth.

## Stack

- Node.js
- Express
- Prisma ORM
- SQLite
- JWT
- CommonJS

## Project Structure

```text
src/
  app.js
  server.js
  config/
    env.js
  modules/
    auth/
    users/
    companies/
    applications/
    questionnaire/
    scoring/
    reviews/
    decisions/
  middleware/
  utils/
prisma/
  schema.prisma
  seed.js
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
copy .env.example .env
```

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Create the SQLite database:

```bash
npm run prisma:push
```

5. Optionally run the seed file:

```bash
npm run prisma:seed
```

6. Start the server:

```bash
npm run dev
```

The API health endpoint is available at `GET /api/health`.

## Notes

- Business logic is intentionally not implemented yet.
- Module files currently expose placeholder handlers and services.
- SQLite is used for local development and can be swapped later.
