# Quotes Service API

A production-ready web service providing random quotes with both RESTful and GraphQL APIs. Built with TypeScript, Fastify, and modern best practices.

## Features

### Core Functionality
- **Random Quote Delivery**: Fetches random quotes from external API (api.quotable.io)
- **Smart Ranking Algorithm**: Prioritizes highly-rated quotes for new users using weighted selection
- **Quote Liking System**: Allows users to like quotes, tracked with engagement metrics
- **Similar Quote Discovery**: Finds comparable quotes based on tags and author
- **Dual API Support**: Both REST and GraphQL interfaces

### Advanced Features
- **Weighted Random Selection**: Uses sophisticated scoring algorithm considering:
  - Popularity (likes with logarithmic scaling)
  - Engagement rate (likes/views ratio)
  - Recency (exponential decay over time)
- **In-Memory Caching**: Efficient quote storage and retrieval
- **Production-Ready**: Docker, Azure deployment, health checks, circuit breaker, and retry logic

## Tech Stack

- **Runtime**: Node.js 22 LTS
- **Package Manager**: pnpm
- **Language**: TypeScript
- **Framework**: Fastify
- **Validation**: Zod
- **GraphQL**: Mercurius
- **Testing**: Vitest
- **Infrastructure**: Docker, Azure App Service, Terraform
- **Logging**: Pino

## Project Structure

```
├── src/
│   ├── config/              # Application configuration
│   ├── constants/           # Application constants
│   ├── graphql/             # GraphQL schema and resolvers
│   ├── health/              # Health check implementation
│   ├── middleware/          # Fastify middleware
│   ├── repositories/        # Data access layer
│   ├── routes/              # REST API routes
│   ├── schemas/             # Zod validation schemas
│   ├── services/            # Business logic
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── __tests__/           # Integration tests
│   └── index.ts             # Application entry point
├── terraform/               # Azure infrastructure as code
├── Dockerfile               # Multi-stage Docker build
└── docker-compose.yml       # Local Docker setup
```

## Quick Start

### Prerequisites
- Node.js 22.20.0+ (LTS)
- pnpm 8+ (recommended) or npm

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd nodejs-assignment
```

2. Install pnpm (if not already installed)
```bash
corepack enable
corepack prepare pnpm@8.15.0 --activate
```

3. Install dependencies
```bash
pnpm install
```

4. Create environment file
```bash
cp .env.example .env
```

5. Start development server
```bash
pnpm dev
```

The service will be available at:
- REST API: http://localhost:3000/api
- GraphQL: http://localhost:3000/graphql
- GraphiQL: http://localhost:3000/graphiql (development only)

### ⚠️ Important Note About External API

**SSL Certificate Issue**: The external quotes API (`https://api.quotable.io`) currently has an **expired SSL certificate**. This causes the following error in production environments:

```
Error: certificate has expired
```

**Solutions:**

1. **For Development/Testing** (Already configured):
   - SSL verification is automatically disabled in `NODE_ENV=development`
   - Tests work properly with this configuration

2. **For Production**:

   **Disable SSL Verification** (Temporary workaround)
   - Set `NODE_TLS_REJECT_UNAUTHORIZED=0` environment variable
   - **Security Warning**: This disables SSL validation for all HTTPS requests
   - Only use this temporarily while the external API has certificate issues

**Current Behavior:**
- Circuit breaker will open after multiple SSL failures
- Application returns cached quotes when available
- Returns `500 Internal Server Error` when no cached quotes exist
- Health check endpoint may report degraded status

## API Documentation

### REST API Endpoints

#### Get Random Quote
```http
GET /api/quotes/random
```

**Response:**
```json
{
  "id": "abc123",
  "content": "The only way to do great work is to love what you do.",
  "author": "Steve Jobs",
  "tags": ["inspiration", "work"],
  "length": 48,
  "likes": 42,
  "views": 100
}
```

#### Get Quote by ID
```http
GET /api/quotes/:id
```

#### Like a Quote
```http
POST /api/quotes/:id/like
```

**Response:**
```json
{
  "id": "abc123",
  "likes": 43,
  "success": true
}
```

#### Get Similar Quotes
```http
GET /api/quotes/:id/similar?limit=5
```

**Response:**
```json
{
  "quotes": [...],
  "total": 5
}
```

#### Get Top Rated Quotes
```http
GET /api/quotes/top-rated?limit=10
```

#### Get Most Viewed Quotes
```http
GET /api/quotes/most-viewed?limit=10
```

#### Get All Quotes
```http
GET /api/quotes
```

**Response:**
```json
{
  "quotes": [...],
  "total": 150
}
```

### GraphQL API

**Endpoint:** `/graphql`

**GraphiQL (Development):** `/graphiql`

#### Queries

```graphql
# Get random quote
query {
  randomQuote {
    id
    content
    author
    tags
    likes
    views
  }
}

# Get specific quote
query {
  quote(id: "abc123") {
    id
    content
    author
  }
}

# Get similar quotes
query {
  similarQuotes(id: "abc123", limit: 5) {
    quotes {
      id
      content
      author
    }
    total
  }
}

# Get top rated quotes
query {
  topRatedQuotes(limit: 10) {
    quotes {
      id
      content
      likes
    }
    total
  }
}
```

#### Mutations

```graphql
# Like a quote
mutation {
  likeQuote(id: "abc123") {
    id
    likes
    success
  }
}
```

## Smart Ranking Algorithm

The service uses a sophisticated ranking algorithm to prioritize high-quality quotes:

### Score Calculation
Each quote receives a score based on three weighted metrics:

1. **Popularity (50% weight)**
   - Uses logarithmic scaling: `log10(likes + 1) / 2`
   - Prevents quotes with extreme like counts from dominating

2. **Engagement (30% weight)**
   - Calculated as: `likes / views`
   - Measures how compelling the quote is to viewers

3. **Recency (20% weight)**
   - Exponential decay: `exp(-hoursSinceView / 24)`
   - Freshly viewed quotes get slightly higher priority

### Weighted Random Selection
Instead of purely random selection, quotes are selected with probability proportional to their score:
- Highly-rated quotes appear more frequently
- Lower-rated quotes still have a chance to be shown
- Ensures diverse content while maintaining quality

## Development

### Available Scripts

```bash
pnpm dev             # Start development server with hot reload
pnpm build           # Build TypeScript to JavaScript
pnpm start           # Start production server
pnpm test            # Run tests
pnpm test:watch      # Run tests in watch mode
pnpm test:coverage   # Generate test coverage report
pnpm lint            # Lint code
pnpm lint:fix        # Fix linting issues
pnpm format          # Format code with Prettier
pnpm format:check    # Check code formatting
pnpm type-check      # Check TypeScript types
```

### Pre-push Hook
Husky is configured to run checks before pushing:
- Code formatting validation
- Linting
- Type checking
- Full test suite

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

## Docker Deployment

### Build and Run Locally

```bash
# Using Docker
docker build -t quotes-service .
docker run -p 3000:3000 quotes-service

# Using Docker Compose (detached mode)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Multi-Stage Build
The Dockerfile uses a multi-stage build for optimal production images:
- Builder stage: Compiles TypeScript
- Production stage: Minimal runtime with only production dependencies
- Non-root user for security
- Health checks included

## Azure Deployment

### Prerequisites
- Azure account
- Terraform installed
- Azure CLI installed and authenticated

### Deploy with Terraform

1. Navigate to terraform directory
```bash
cd terraform
```

2. Copy and configure variables
```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

3. Initialize Terraform
```bash
terraform init
```

4. Review deployment plan
```bash
terraform plan
```

5. Deploy infrastructure
```bash
terraform apply
```

### Azure Resources Created
- **Resource Group**: Container for all resources
- **Container Registry**: Stores Docker images
- **App Service Plan**: Compute resources (B1 SKU)
- **Linux Web App**: Hosts the containerized application

### CI/CD Pipeline (Recommended)

1. Build Docker image
2. Push to Azure Container Registry
3. Update App Service with new image
4. Health check verification

Example workflow:
```bash
# Build and tag
docker build -t quotes-service:latest .

# Tag for ACR
docker tag quotes-service:latest <acr-name>.azurecr.io/quotes-service:latest

# Login to ACR
az acr login --name <acr-name>

# Push image
docker push <acr-name>.azurecr.io/quotes-service:latest

# Restart App Service
az webapp restart --name <app-name> --resource-group <rg-name>
```

## Architecture Decisions

### Repository Pattern
Separates data access logic from business logic, enabling:
- Easy testing with mock repositories
- Future database integration without service changes
- Clean separation of concerns

### Service Layer
Business logic isolated in dedicated service classes:
- **QuoteService**: Orchestrates quote operations
- **QuoteRankingService**: Implements scoring algorithm
- **ExternalQuotesService**: Handles external API communication

### Type Safety
Comprehensive TypeScript types and Zod validation ensure:
- Compile-time type checking
- Runtime validation
- Self-documenting API contracts

### Dual API Support
REST and GraphQL serve different use cases:
- **REST**: Simple, cacheable, standard HTTP semantics
- **GraphQL**: Flexible queries, reduced over-fetching

## Monitoring and Observability

### Health Check
```http
GET /health
```

Returns service status, uptime, and environment information.

### Logging
Structured logging with Pino:
- Development: Pretty-printed, colorized output
- Production: JSON-formatted for log aggregation
- Configurable log levels (debug, info, warn, error)
- Request ID tracking for distributed tracing

## Configuration

Environment variables:
```bash
NODE_ENV=development                           # Environment: development, test, production
PORT=3000                                      # Server port
HOST=0.0.0.0                                  # Server host
LOG_LEVEL=info                                # Log level: debug, info, warn, error
QUOTES_API_URL=https://api.quotable.io/quotes # External quotes API
ALLOWED_ORIGINS=*                             # CORS allowed origins (comma-separated)
RATE_LIMIT_MAX=100                            # Max requests per time window
RATE_LIMIT_WINDOW=60000                       # Rate limit window in milliseconds
```

## Testing Strategy

### Unit Tests
- Repository layer: Data access logic
- Service layer: Business logic and algorithms
- Validators: Schema validation

### Integration Tests
- REST API endpoints
- GraphQL queries and mutations
- End-to-end request flows

### Coverage Goals
- Branches: 70%+
- Functions: 70%+
- Lines: 70%+
- Statements: 70%+

## Performance Considerations

### Caching Strategy
- In-memory quote cache reduces external API calls
- View and like counts tracked per quote
- Future enhancement: Redis for distributed caching

### Optimization Techniques
- Weighted random selection (O(n) time complexity)
- Efficient filtering with Map data structure
- Logarithmic scaling prevents score dominance

## Security

- **Helmet**: Security headers configured (CSP, HSTS, etc.)
- **CORS**: Configurable allowed origins
- **Rate Limiting**: Prevents abuse (100 requests/minute by default)
- **Input Validation**: Zod schema validation
- **HTTPS Only**: Enforced in production
- **Non-root Docker User**: Runs as nodejs:nodejs (UID 1001)
- **SSL Verification**: Enabled in production, disabled only in development
- **Error Handling**: Stack traces hidden in production

## Future Enhancements

- [ ] **Migrate to NestJS**: Consider migrating from Fastify to NestJS framework for better scalability, built-in dependency injection, and enterprise-grade architecture
- [ ] Redis for distributed caching
- [ ] PostgreSQL for persistent storage
- [ ] User authentication and personalized recommendations
- [ ] Metrics and observability (Prometheus, Grafana)

## AI Assistance Disclosure

This project was developed with the assistance of AI tools:

- **README Documentation**: AI-assisted in generating comprehensive documentation, API examples, and usage instructions
- **Test Case Generation**: AI helped generate some test cases and test scenarios to improve code coverage
- **Code Review**: AI assistance was used for code optimization and best practices implementation

All AI-generated content was reviewed, tested, and validated to ensure production quality and correctness.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run linting and tests
5. Submit a pull request

## License

MIT

## Author

**Teshaev Furqat**
- Email: furqattrade@gmail.com
- GitHub: [@furqattrade](https://github.com/furqattrade)

## Support

For issues and questions:
- Open an issue on GitHub
- Contact: furqattrade@gmail.com

---

Built with ❤️ using TypeScript, Fastify, and modern web technologies.
