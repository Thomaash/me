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

The application is fully containerized and ready for production deployment. Database initialization happens automatically on first startup.

### Prerequisites for Docker

- Docker and Docker Compose installed
- For custom JWT_SECRET: generate a secure random string

### How Docker Startup Works

1. **Build Stage**: Installs dependencies and generates Prisma Client
2. **Runtime Stage**: 
   - Container starts with `docker-entrypoint.sh` script
   - Script checks if database exists at `/data/db.sqlite`
   - If missing, runs `prisma db push` to create schema
   - Then starts the application
   - Subsequent restarts skip initialization

### Quick Start with Docker Compose

The easiest way to run the backend:

```bash
docker-compose up -d
```

This will:
- Build the Docker image
- Create and start the container
- Create persistent data volume
- Initialize the database schema
- Generate Prisma client
- Start the application

Access the backend at `http://localhost:4000`

**Stop the container:**

```bash
docker-compose down
```

**Stop and remove data:**

```bash
docker-compose down -v
```

**View logs:**

```bash
docker-compose logs -f backend
```

### Manual Docker Build and Run

Build the image:

```bash
docker build -t me-backend:latest .
```

Run the container:

```bash
docker run -d \
  --name me-backend \
  -e DATABASE_URL="file:/data/db.sqlite" \
  -e PORT="4000" \
  -e JWT_SECRET="your-very-secure-secret-key" \
  -e NODE_ENV="production" \
  -p 4000:4000 \
  -v backend-data:/data \
  me-backend:latest
```

**Check container status:**

```bash
docker ps
docker logs me-backend
```

**Stop container:**

```bash
docker stop me-backend
docker rm me-backend
```

### Docker Build Details

The Dockerfile uses a multi-stage build:

1. **Build Stage**: Installs all dependencies (including Prisma CLI)
2. **Runtime Stage**: 
   - Copies production dependencies
   - Generates Prisma Client (`prisma generate`)
   - Initializes database (`prisma db push`)
   - Starts the application

The image includes:
- Alpine Linux (minimal size ~200MB)
- Node.js 18
- dumb-init (for proper signal handling)
- curl (for health checks)

### Environment Variables in Docker

Set via `-e` flag or in `docker-compose.yml`:

- `NODE_ENV` - Set to `production`
- `PORT` - Container port (default: 4000)
- `DATABASE_URL` - SQLite path (default: `file:/data/db.sqlite`)
- `JWT_SECRET` - **IMPORTANT**: Use a strong random string in production!

### Persistent Storage

Database data is stored in Docker volumes:

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect backend-data

# Backup database
docker run --rm -v backend-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/db-backup.tar.gz -C /data .

# Restore database
docker run --rm -v backend-data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/db-backup.tar.gz -C /data
```

### Health Checks

The container includes automated health checks:

```bash
# Check container health
docker ps --filter "name=me-backend"
```

Health check endpoint: `GET http://localhost:4000/api/me`
- Runs every 30 seconds
- Times out after 3 seconds
- Waits 10 seconds before first check
- Fails after 3 failed attempts

### Production Considerations

1. **JWT_SECRET**: Generate a secure random string
   ```bash
   openssl rand -base64 32
   ```

2. **CORS**: Update `src/index.js` to allow your frontend domain
   ```javascript
   app.use(cors({ origin: "https://yourdomain.com" }));
   ```

3. **Database**: For production, consider:
   - Using managed PostgreSQL instead of SQLite
   - Regular backups of the data volume
   - Mounting volumes on persistent storage

4. **SSL/TLS**: Use a reverse proxy (Nginx) with SSL termination

5. **Monitoring**: Use Docker's logging and health checks

### Troubleshooting Docker

**Container exits immediately:**

```bash
docker logs me-backend
```

**Database initialization failed:**

```bash
docker-compose down -v
docker-compose up -d
```

**Permission issues with volume:**

```bash
docker exec me-backend chmod 777 /data
```

**Port already in use:**

```bash
docker run -p 4001:4000 ...  # Use different external port
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