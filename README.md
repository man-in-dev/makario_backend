# Makario Backend API

Backend API for Makario application built with Node.js and Express.

## Features

- MongoDB database integration
- JWT-based authentication
- Password hashing with bcrypt
- Input validation with Joi
- Industry-standard folder structure
- Error handling middleware
- CORS enabled
- Payment integration with Cashfree
- Shipping integration with Shipway

## Project Structure

```
backend/
├── config/          # Configuration files (database, JWT)
├── controllers/     # Request handlers
├── middleware/      # Custom middleware (auth, validation, error handling)
├── models/          # Data models (if using database)
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
├── validators/      # Joi validation schemas
├── server.js        # Entry point
└── package.json     # Dependencies
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Setup MongoDB (see SETUP.md for detailed instructions)

3. Create a `.env` file in the backend directory:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/makario
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:8080

# Cashfree Payment Gateway (Optional)
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_ENV=sandbox
CASHFREE_API_VERSION=2023-08-01
BACKEND_URL=http://localhost:3000

# Shipway Shipping Integration (Optional)
SHIPWAY_USERNAME=your_shipway_username
SHIPWAY_PASSWORD=your_shipway_password
SHIPWAY_LICENSE_KEY=your_shipway_license_key
SHIPWAY_API_BASE_URL=https://api.shipway.in/api
SHIPWAY_AUTO_CREATE_SHIPMENT=false
SHIPWAY_DEFAULT_WEIGHT=0.5
SHIPWAY_DEFAULT_LENGTH=10
SHIPWAY_DEFAULT_BREADTH=10
SHIPWAY_DEFAULT_HEIGHT=10
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Health Check

- `GET /health` - Server health check

### Shipway Shipping

- `POST /api/shipway/orders/:orderId/create-shipment` - Create a shipment for an order (protected)
- `GET /api/shipway/orders/:orderId/track` - Track a shipment (optional auth)
- `GET /api/shipway/orders/:orderId/label` - Get shipping label (protected)
- `POST /api/shipway/orders/:orderId/cancel-shipment` - Cancel a shipment (protected)
- `GET /api/shipway/couriers?pincode=123456` - Get available couriers for a pincode
- `POST /api/shipway/webhook` - Webhook endpoint for Shipway tracking updates

## Environment Variables

### Core Configuration
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string (default: mongodb://localhost:27017/makario)
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - Token expiration time (default: 7d)
- `FRONTEND_URL` - Frontend URL for CORS
- `BACKEND_URL` - Backend URL for webhooks

### Shipway Configuration
- `SHIPWAY_USERNAME` - Your Shipway account username
- `SHIPWAY_PASSWORD` - Your Shipway account password
- `SHIPWAY_LICENSE_KEY` - Your Shipway license key (received after registration)
- `SHIPWAY_API_BASE_URL` - Shipway API base URL (default: https://api.shipway.in/api)
- `SHIPWAY_AUTO_CREATE_SHIPMENT` - Auto-create shipments when orders are confirmed (default: false)
- `SHIPWAY_DEFAULT_WEIGHT` - Default package weight in kg (default: 0.5)
- `SHIPWAY_DEFAULT_LENGTH` - Default package length in cm (default: 10)
- `SHIPWAY_DEFAULT_BREADTH` - Default package breadth in cm (default: 10)
- `SHIPWAY_DEFAULT_HEIGHT` - Default package height in cm (default: 10)

## Database

- Uses MongoDB for data persistence
- User data is stored in the `users` collection
- Database connection is established automatically on server start
- Supports both local MongoDB and MongoDB Atlas (cloud)

## Shipway Integration

Shipway is integrated for shipping and logistics management. To use Shipway:

1. **Register on Shipway**: Create an account at [dashboard.shipway.in](https://dashboard.shipway.in/register)
2. **Get API Credentials**: After registration, you'll receive your username, password, and License Key via email
3. **Configure Environment Variables**: Add your Shipway credentials to the `.env` file
4. **Set Webhook URL**: In your Shipway dashboard, configure the webhook URL to: `{BACKEND_URL}/api/shipway/webhook`
5. **Auto-Create Shipments**: Set `SHIPWAY_AUTO_CREATE_SHIPMENT=true` to automatically create shipments when orders are confirmed

### Shipway Features
- Automatic shipment creation when orders are confirmed (if enabled)
- Real-time tracking updates via webhooks
- Shipping label generation
- Courier selection based on pincode
- Order status synchronization with shipment status

## Notes

- Data is persisted in MongoDB (not lost on server restart)
- Ensure MongoDB is running before starting the server
- For production, use MongoDB Atlas or a managed MongoDB service
- Ensure JWT_SECRET is strong and kept secure in production
- Shipway integration is optional - the system works without it
- See SETUP.md for detailed MongoDB setup instructions

