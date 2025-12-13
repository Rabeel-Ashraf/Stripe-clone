# Setup Guide

This guide will help you set up the production-grade foundational database schema and merchant authentication system for the educational Stripe replica.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ 
- Git

## Step 1: Clone and Install Dependencies

```bash
git clone <repository-url>
cd stripe-clone-foundation
npm install
```

## Step 2: Database Setup

### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL container
docker run --name stripe-clone-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_USER=stripe_user \
  -e POSTGRES_DB=stripe_clone_dev \
  -p 5432:5432 \
  -d postgres:15

# Set the database URL in .env
echo 'DATABASE_URL="postgresql://stripe_user:password@localhost:5432/stripe_clone_dev"' > .env
```

### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create database:
```bash
createdb stripe_clone_dev
```

3. Update `.env` file with your database URL.

## Step 3: Environment Configuration

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Generate NextAuth secret:
```bash
openssl rand -base64 32
```

3. Update `.env` file with your values:
```env
DATABASE_URL="postgresql://stripe_user:password@localhost:5432/stripe_clone_dev"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"
EMAIL_PROVIDER="console"
RATE_LIMIT_ATTEMPTS="5"
RATE_LIMIT_WINDOW_MS="900000"
JWT_EXPIRY_DAYS="30"
LOG_LEVEL="info"
```

## Step 4: Database Migration

Initialize the database schema:

```bash
npm run db:migrate
```

This will create all necessary tables and indexes.

## Step 5: Seed Database

Create test merchants with different tiers:

```bash
npm run db:seed
```

This creates:
- **demo@stripe-clone.test** (Starter) - Password: `Demo1234!`
- **pro@stripe-clone.test** (Pro) - Password: `ProDemo1234!`
- **enterprise@stripe-clone.test** (Enterprise) - Password: `EntDemo1234!`

Each merchant includes:
- API keys (production + test)
- Webhook endpoints
- Settings configuration
- Initial audit logs

## Step 6: Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to access the application.

## Step 7: Verify Setup

### Health Check
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "uptime": 12345,
  "dbConnection": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### Test Authentication

1. Visit http://localhost:3000/auth/signin
2. Use one of the test accounts from seeding
3. Verify successful login and dashboard access

### Test API Key Management

Generate a new API key:
```bash
npm run manage-api-keys generate --merchant-email=demo@stripe-clone.test --name="Test Key"
```

List all API keys:
```bash
npm run manage-api-keys list-all
```

## Development Commands

```bash
# Database operations
npm run db:push          # Push schema changes
npm run db:migrate       # Create migration
npm run db:migrate:prod  # Run migrations in production
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database

# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run type-check       # Run TypeScript type checking

# Testing
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode

# Code Quality
npm run lint             # Run ESLint
```

## Troubleshooting

### Database Connection Issues

1. Check PostgreSQL is running:
```bash
pg_isready -h localhost -p 5432
```

2. Verify connection string in `.env`
3. Check firewall settings

### Migration Issues

```bash
# Reset migrations (⚠️  destroys all data)
npx prisma migrate reset

# Or force reset
npx prisma db push --force-reset
```

### Test Account Issues

If test accounts don't work:

```bash
# Clear and reseed
npm run db:reset
npm run db:seed
```

## Production Deployment

1. **Environment Variables**: Set all production environment variables
2. **Database**: Use production PostgreSQL instance
3. **HTTPS**: Required for NextAuth secure cookies
4. **Rate Limiting**: Consider Redis for production rate limiting
5. **Monitoring**: Set up health checks and logging

See [SECURITY.md](./SECURITY.md) for production security checklist.

## Next Steps

- Review [AUTH_FLOW.md](./AUTH_FLOW.md) for authentication architecture
- Check [API_KEYS.md](./API_KEYS.md) for API key management
- Read [SECURITY.md](./SECURITY.md) for security considerations
- See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines
