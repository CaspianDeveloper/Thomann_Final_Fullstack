# Thomann Shop: Full Stack

An online musical-instruments shop. React frontend + REST API (Express 5, TypeScript, PostgreSQL, Prisma 7).

-**Live API:** https://thomann-final-fullstack.onrender.com, docs at [`/docs`](https://thomann-final-fullstack.onrender.com/docs)
-**Live frontend:** https://thomann-final-fullstack.vercel.app

- **Note:** the API runs on Render's free tier and sleeps after 15 minutes of inactivity, so the first request can take up to a minute.

## Features

- Register / login with JWT, roles `USER` and  `ADMIN`
- Catalog with pagination, search, filters (category, brand,  price) and sorting
- Cart, wishlist, orders (transactional checkout, stock never goes negative)
- - Admin: API for categories, products and order statuses; the frontend admin panel covers products and orders
- Zod validation on every endpoint, one error format, OpenAPI docs at `/docs`
- 43 Vitest tests against a real PostgreSQL database

## Stack

Node.js 22, Express 5, TypeScript, PostgreSQL 16, Prisma 7, Zod 4, argon2, jsonwebtoken, Vitest + Supertest, Docker.

## Run with Docker (recommended)

Requires Docker Desktop.

```bash
docker compose up --build
docker compose exec api npm run seed               # creates the admin
docker compose exec api npm run seed:products      # 18 categories, 92 products
```

- API: http://localhost:3001
- Swagger UI: http://localhost:3001/docs
- Local admin (Docker defaults): `admin@example.com` / `change-this-admin-password`

Stop with `docker compose down` (add `-v` only if you want to wipe the database).

## Run locally (without the API container)

The local dev server uses http://localhost:3000; the Docker API container uses 
http://localhost:3001, so both can run at the same time.

```bash
docker compose up -d db  # PostgreSQL on localhost:5433
cd server
cp .env.example .env    # then edit the values
npm install
npx prisma generate --config prisma7.config.ts
npx prisma migrate deploy --config prisma7.config.ts
npm run seed && npm run seed:products
npm run dev
```

## Enviroment variables (`server/.env`)

| Name | Description |
|--|--|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Long random secret for signing tokens |
| `PORT` | HTTP port (default 3000) |
| `CLIENT_URL` | Frontend origin allowed by CORS |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Used by the seed script to create the admin |

## Tests

Tests run againist a seperate database `thomann_test`,

```bash
docker compose exec db psql -U postgres -c "CREATE DATABASE thomann_test;" # once
cd server
# create server/.env.test with DATABASE_URL pointing to thomann_test
npm test
```

## API overview

All errors use one format: `{"error": { "code": "...", "message": "...", "details": [...] }}`.
Authenticated endpoints expect `Authorization: Bearer <token>`.

| Area | Endpoints |
|--|--| 
| Auth | `POST /auth/register` , `POST /auth/login`, `GET /auth/me` | 
| Categories | `GET /categories` , admin: `POST` , `PATCH/:id` , `DELETE /:id` |
| Products | `GET /products` (page, limit, search, category, brand, minPrice, maxPrice, sort) , `GET /products/:id` , admin: `POST`, `PATCH /:id`, `DELETE /:id` (soft delete) |
| Cart | `GET /cart` , `POST /cart/items` , `PATCH /cart/items/:productId` , `DELETE /cart/items/:productId` | 
| Wishlist | `GET /wishlist` , `POST /wishlist` , `DELETE /wishlist/:productId` | 
| Orders | `POST /orders` , `GET /orders` , `GET /orders/:id` , `POST /orders/:id/cancel` | 
| Admin | `GET /admin/products` , `GET /admin/orders` , `GET /admin/orders/:id` , `PATCH /admin/orders/:id/status` |

Full interactive documentation: `/docs` (OpenAPI JSON at `/openapi.json`).

## Business rules (each covered by tests)

1. Stock never goes negative (transaction + conditional update + `CHECK (stock >= 0)`).
2. The server decides prices; order lines store a price snapshot.
3. No duplicate cart or wishlist rows; adding again increases the quantity.
4. Another user's cart, wishlist or order returns 404.
5. A category with products cannot be deleted (409); ordered products are only deactivated.
6. Order status moves forward only (PENDING -> PAID -> SHIPPED -> DELIVERED); cancel restores stock exactly once.
7. No order from an empty cart (400); inactive or out-of-stock items give 409.
8. `role` is never accepted from the client; email is unique and lowercased; `passwordHash` is never returned.

## Project structure


```
client/                         React frontend
server/ 
    prisma/                     schema, migrations, seed scripts
    src/
        schemas/                Zod schemas
        services/               business logic and Prisma
        controllers/            request parsing and responses
        routes/                 routes and middleware
        middleware/             auth, error handler
        docs/                   OpenAPI document
      tests/                    Vitest + Supertest integration tests
docker-compose.yml              PostgreSQL + API
```
        

