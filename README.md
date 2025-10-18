# Backend Service

A comprehensive Node.js/TypeScript backend service for the CS3203 project, providing RESTful APIs for a service marketplace platform.

## Features

- **User Management**: Registration, authentication, and profile management
- **Service Providers**: Provider profiles, verification, and service offerings
- **Companies**: Company management for service providers
- **Services & Categories**: Service listings with categorization
- **Service Requests**: Customer service booking system
- **Payments**: Stripe integration for secure payments
- **Reviews & Ratings**: Customer and service reviews
- **Notifications**: Real-time notifications and email services
- **Admin Panel**: Administrative controls and analytics
- **Chatbot**: AI-powered customer support
- **Scheduling**: Appointment and service scheduling
- **File Uploads**: AWS S3 integration for image/document storage
- **Real-time Communication**: WebSocket support for live updates
- **Message Queue**: RabbitMQ for asynchronous processing
- **Load Testing**: Comprehensive performance testing with Artillery and K6

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt hashing
- **Payments**: Stripe API
- **File Storage**: AWS S3
- **Email Service**: AWS SES
- **Message Queue**: RabbitMQ (AMQP)
- **Geospatial**: PostGIS extensions
- **Testing**: Jest with Supertest
- **Load Testing**: Artillery, K6
- **Process Management**: PM2
- **Development**: Nodemon, tsx

## Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL database
- RabbitMQ server (optional, for email queue)
- AWS account (for S3 and SES)
- Stripe account (for payments)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/CS3203-Project/backend.git
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev

   # Seed the database (optional)
   npm run seed
   ```

## Configuration

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# JWT
JWT_SECRET=your_jwt_secret_here

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=eu-north-1
AWS_S3_BUCKET_NAME=your_bucket_name

# Server
PORT=3000

# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USER=your_email@example.com
MAIL_PASS=your_email_password
MAIL_FROM="Zia" <no-reply@Zia.com>

# RabbitMQ
RABBITMQ_URL=amqps://user:password@host/vhost

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Running the Application

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Using PM2 (Production)
```bash
npm run pm2:start
npm run pm2:logs
npm run pm2:stop
```

## Testing

### Unit Tests
```bash
npm test
npm run test:watch
npm run test:coverage
```

### Integration Tests
```bash
npm run test:integration
npm run test:integration:watch
```

### Admin Tests
```bash
npm run test:admin
npm run test:admin:watch
```

### API Tests
```bash
npm run test:api
```

### Performance Tests
```bash
npm run test:perf
```

## Load Testing

### Artillery Tests
```bash
# Basic load test
npm run load:artillery

# Stress test
npm run load:artillery:stress

# Spike test
npm run load:artillery:spike

# User registration test
npm run load:artillery:user-reg

# Generate report
npm run load:artillery:report
```

### K6 Tests
```bash
# Load test
npm run load:k6

# Stress test
npm run load:k6:stress

# Spike test
npm run load:k6:spike

# Soak test
npm run load:k6:soak

# User registration test
npm run load:k6:user-reg
```

## Project Structure

```
backend/
├── src/
│   ├── Admin/           # Admin panel controllers and routes
│   ├── controllers/     # API controllers
│   ├── middlewares/     # Express middlewares
│   ├── modules/         # Feature modules (chatbot, etc.)
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── validators/      # Input validation schemas
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── seed.ts          # Database seeding
│   └── migrations/      # Database migrations
├── tests/               # Test files
├── load-tests/          # Load testing configurations
├── scripts/             # Utility scripts
├── jmeter/              # JMeter test files
└── coverage/            # Test coverage reports
```

## API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Service Providers
- `GET /api/providers` - List providers
- `GET /api/providers/:id` - Get provider details
- `PUT /api/providers/:id` - Update provider profile

### Services
- `GET /api/services` - List services
- `POST /api/services` - Create service
- `GET /api/services/:id` - Get service details
- `PUT /api/services/:id` - Update service

### Categories
- `GET /api/categories` - List categories
- `GET /api/categories/:id` - Get category details

### Service Requests
- `POST /api/service-requests` - Create service request
- `GET /api/service-requests` - List user requests
- `PUT /api/service-requests/:id` - Update request

### Payments
- `POST /api/payments/create-session` - Create payment session
- `POST /api/payments/webhook` - Stripe webhook
- `GET /api/payments/:id` - Get payment details

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/:targetId` - Get reviews
- `PUT /api/reviews/:id` - Update review

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - User management
- `GET /api/admin/providers` - Provider management

### Chatbot
- `POST /api/chatbot/message` - Send message to chatbot

### Schedule
- `POST /api/schedule` - Create schedule
- `GET /api/schedule` - Get schedules
- `PUT /api/schedule/:id` - Update schedule

## Database Schema

The application uses PostgreSQL with PostGIS extensions for geospatial data. Key models include:

- **User**: User accounts and profiles
- **ServiceProvider**: Service provider information
- **Company**: Company details for providers
- **Service**: Service offerings
- **Category**: Service categories
- **ServiceRequest**: Customer service requests
- **Payment**: Payment transactions
- **Review**: User reviews and ratings
- **Notification**: System notifications
- **Schedule**: Appointment scheduling
- **Message**: User messaging system

## Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting (30-minute windows)
- CORS configuration
- Input validation with Joi
- SQL injection prevention via Prisma
- XSS protection
- Secure file upload validation

## Performance

- Database connection pooling
- Query optimization with indexes
- Caching strategies
- Rate limiting
- Load balancing ready
- Comprehensive monitoring and logging

## Development Scripts

```bash
# Database operations
npm run seed                    # Seed database
npx prisma studio               # Open Prisma Studio
npx prisma migrate dev          # Run migrations
npx prisma generate             # Generate Prisma client

# Code quality
npm run build                   # Build TypeScript
npm run test:coverage           # Run tests with coverage

# Load testing
npm run load:artillery:report   # Generate Artillery report
```

## Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**

3. **Run database migrations**
   ```bash
   npx prisma migrate deploy
   ```

4. **Start with PM2**
   ```bash
   npm run pm2:start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support, please contact the development team or create an issue in the repository.