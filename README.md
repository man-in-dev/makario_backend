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

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string (default: mongodb://localhost:27017/makario)
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - Token expiration time (default: 7d)
- `FRONTEND_URL` - Frontend URL for CORS

## Database

- Uses MongoDB for data persistence
- User data is stored in the `users` collection
- Database connection is established automatically on server start
- Supports both local MongoDB and MongoDB Atlas (cloud)

## Notes

- Data is persisted in MongoDB (not lost on server restart)
- Ensure MongoDB is running before starting the server
- For production, use MongoDB Atlas or a managed MongoDB service
- Ensure JWT_SECRET is strong and kept secure in production
- See SETUP.md for detailed MongoDB setup instructions

