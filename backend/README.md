# Backend (Prisma + Express)

A REST API backend built with Express.js and Prisma ORM using SQLite database for managing network topology configurations with user authentication.

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Prisma** - ORM for database management
- **SQLite** - Database (file-based)
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **CORS** - Cross-origin request handling

## Prerequisites

- Node.js 14+ and npm
- Git

## Local Development Setup

### 1. Clone and Navigate

```bash
cd /path/to/repo
cd backend
```

### 2. Install Dependencies

From repository root:
```bash
npm install
```

Or from `/backend` directory:
```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and adjust as needed:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL` - Path to SQLite database (default: `file:./dev.db`)
- `PORT` - Server port (default: `4000`)
- `JWT_SECRET` - Secret key for JWT tokens (change in production!)
- `NODE_ENV` - Environment (development/production)

### 4. Setup Database

Generate Prisma client:
```bash
npm run prisma:generate
```

Push schema to database:
```bash
npm run prisma:db:push
```

### 5. Seed Sample Data (Optional)

Load development data:
```bash
npm run seed
```

### 6. Start Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will listen on `http://localhost:4000` (or configured PORT)

## API Endpoints

### Authentication

- **POST /api/register**
  - Body: `{ email, password, name? }`
  - Returns: `{ token, user }`
  - Creates new user and returns JWT token

- **POST /api/login**
  - Body: `{ email, password }`
  - Returns: `{ token, user }`
  - Authenticates user and returns JWT token

- **GET /api/me**
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ user }`
  - Requires valid token, returns authenticated user

### Configurations

- **POST /api/configs**
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ projectName, items, version, startScript, ... }`
  - Returns: `{ status, name, createdAt|updatedAt }`
  - Saves or updates a network topology configuration

- **GET /api/configs**
  - Headers: `Authorization: Bearer <token>`
  - Query: `?full=true` (optional - include full content)
  - Returns: `{ configs: [...] }`
  - Lists all saved configurations for authenticated user

- **GET /api/configs/:name**
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ config }`
  - Fetches specific configuration by name with full content

- **DELETE /api/configs/:name**
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ success: true }`
  - Deletes a configuration by name

## Database Schema

### User Model
- `id` - Integer (primary key)
- `email` - String (unique)
- `password` - String (hashed)
- `name` - String (optional)
- `createdAt` - DateTime

### Config Model
- `userId` - Integer (foreign key to User)
- `name` - String
- `content` - String (JSON stringified)
- `createdAt` - DateTime
- `updatedAt` - DateTime
- Composite primary key: `(userId, name)`

## Available Scripts

```bash
# Start in production mode
npm start

# Start in development mode with auto-reload
npm run dev

# Generate Prisma client
npm run prisma:generate

# Push Prisma schema to database
npm run prisma:db:push

# Seed database with sample data
npm run seed
```

## Frontend Integration

The frontend dev server is configured to proxy `/api` requests to `http://127.0.0.1:4000`.

To run both frontend and backend:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

Frontend will automatically proxy API calls to the backend.

## Production Deployment

### Environment Setup

Before deploying, update `.env`:

```env
DATABASE_URL=file:/data/db.sqlite
PORT=4000
JWT_SECRET=your-very-secure-random-string-change-this
NODE_ENV=production
```

### Database

For production, consider:
- Using a persistent volume for SQLite or
- Migrating to PostgreSQL/MySQL by updating `prisma/schema.prisma`

### CORS Configuration

Update `src/index.js` to allow your frontend domain:

```javascript
app.use(cors({ origin: "https://yourdomain.com" }));
```

## Docker Deployment

See [Dockerfile](./Dockerfile) for containerized deployment.

### Build Image

```bash
docker build -t me-backend .
```

### Run Container

```bash
docker run -d \
  -e DATABASE_URL="file:/data/db.sqlite" \
  -e PORT="4000" \
  -e JWT_SECRET="your-secret-key" \
  -e NODE_ENV="production" \
  -p 4000:4000 \
  -v backend-data:/data \
  me-backend
```

## Troubleshooting

### Port Already in Use

If port 4000 is in use:
```bash
# Change PORT in .env to 4001
PORT=4001 npm run dev
```

### Database Issues

Reset database:
```bash
rm dev.db
npm run prisma:db:push
npm run seed
```

### JWT Token Expired

Tokens expire after 1 hour. Request a new token by logging in again.

## Development Notes

- All passwords are hashed with bcryptjs (salt rounds: 10)
- JWT tokens expire in 1 hour
- Max JSON request body: 1MB (for large configs)
- SQLite database file: `./dev.db`

## License

See LICENSE file in repository root.