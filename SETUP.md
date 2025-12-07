# Backend Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Setup MongoDB**
   
   You have two options:
   
   **Option A: Local MongoDB**
   - Install MongoDB locally from [mongodb.com](https://www.mongodb.com/try/download/community)
   - Start MongoDB service
   - Default connection string: `mongodb://localhost:27017/makario`
   
   **Option B: MongoDB Atlas (Cloud)**
   - Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create a cluster and get your connection string
   - Use the connection string in your `.env` file

3. **Create Environment File**
   
   Create a `.env` file in the `backend` directory with the following content:
   
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/makario
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:8080
   BACKEND_URL=http://localhost:3000
   
   # Cashfree Configuration (for online payments)
   CASHFREE_ENV=sandbox
   CASHFREE_APP_ID=your_cashfree_app_id
   CASHFREE_SECRET_KEY=your_cashfree_secret_key
   CASHFREE_API_VERSION=2023-08-01
   CASHFREE_RETURN_URL=http://localhost:8080/payment/callback
   CASHFREE_NOTIFY_URL=http://localhost:3000/api/payments/webhook
   ```
   
   **For MongoDB Atlas, use:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/makario?retryWrites=true&w=majority
   ```
   
   **Important:** 
   - Change `JWT_SECRET` to a strong, random string in production!
   - Replace `username` and `password` in MongoDB Atlas connection string with your actual credentials
   - For Cashfree integration:
     - Sign up at [cashfree.com](https://www.cashfree.com)
     - Get your App ID and Secret Key from the dashboard
     - **IMPORTANT**: Use production credentials for production environment, sandbox credentials for testing
     - Add them to your `.env` file
     - Set `CASHFREE_ENV=production` when going live
     - Set `CASHFREE_API_VERSION=2023-08-01` (or `2022-09-01`, `2024-01-01` - check Cashfree docs for latest)
     - In frontend, create `.env` file with `VITE_CASHFREE_ENV=sandbox` (or `production`)
     - **Production Setup**: Ensure you're using production App ID and Secret Key from Cashfree merchant dashboard
     - **Authentication Error Fix**: If you get "authentication Failed" error, verify:
       1. You're using the correct credentials for the environment (production vs sandbox)
       2. The API version is supported by Cashfree
       3. Your account has S2S (Server-to-Server) feature approved

4. **Start the Server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Verify Server is Running**
   
   Open your browser and visit: `http://localhost:3000/health`
   
   You should see: `{"status":"ok","message":"Server is running"}`
   
   Check the console for: `MongoDB connected successfully`

## API Endpoints

### Authentication

- **POST** `/api/auth/register` - Register a new user
  - Body: `{ name, email, password, phone?, address?, city?, state?, pincode? }`
  - Returns: `{ success: true, message: "...", data: { user, token } }`

- **POST** `/api/auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: `{ success: true, message: "...", data: { user, token } }`

- **GET** `/api/auth/me` - Get current user profile (Protected)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ success: true, message: "...", data: { user } }`

- **PUT** `/api/auth/profile` - Update user profile (Protected)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ name?, phone?, address?, city?, state?, pincode?, addresses? }`
  - Returns: `{ success: true, message: "...", data: { user } }`

### Payment (Cashfree)

- **POST** `/api/payments/create-session` - Create a Cashfree payment session (Optional Auth)
  - Body: `{ orderId, amount, customerDetails: { customerId, customerEmail, customerPhone, customerName? }, orderNote? }`
  - Returns: `{ success: true, message: "...", data: { paymentSessionId, orderId } }`

- **POST** `/api/payments/verify` - Verify payment status (Optional Auth)
  - Body: `{ orderId }`
  - Returns: `{ success: true, message: "...", data: { order, paymentStatus, cashfreeOrder } }`

- **POST** `/api/payments/webhook` - Cashfree webhook endpoint (No Auth)
  - Receives payment status updates from Cashfree
  - Automatically updates order payment status

## Frontend Integration

The frontend is already configured to use the backend API. Make sure:

1. Backend is running on `http://localhost:3000`
2. Frontend is running on `http://localhost:8080`
3. The `VITE_API_URL` environment variable in frontend is set to `http://localhost:3000/api` (or update `frontend/src/utils/api.ts`)

## MongoDB Connection

The application will automatically connect to MongoDB when the server starts. If the connection fails:

1. Check if MongoDB is running (for local installation)
2. Verify the `MONGODB_URI` in your `.env` file
3. Check network connectivity (for MongoDB Atlas)
4. Ensure your IP is whitelisted in MongoDB Atlas (if using cloud)

## Notes

- Data is now persisted in MongoDB (not lost on server restart)
- The database name is `makario` (can be changed in connection string)
- User collection will be created automatically on first user registration
- Use strong JWT secrets in production
- Ensure CORS is properly configured for your frontend URL
