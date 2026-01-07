# Portfolio View - Backend API

Express.js REST API backend for the Portfolio View application.

## 🏗️ Project Structure

```
backend/
├── config/               # Configuration files
│   └── db.js            # Database configuration
├── routes/              # API route definitions
│   ├── auth.routes.js   # Authentication routes (/api/auth)
│   └── user.routes.js   # User routes (/api/users)
├── controllers/         # Request handlers
│   ├── auth.controller.js
│   └── user.controller.js
├── middleware/          # Custom middleware
│   └── auth.middleware.js  # JWT authentication
├── services/            # Business logic layer
│   └── user.service.js
├── app.js              # Express app configuration
├── server.js           # Server entry point
├── .env                # Environment variables
└── package.json        # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env` and update the values
   - Set your `JWT_SECRET`
   - Configure database connection

3. Run the development server:
```bash
npm run dev
```

4. Run the production server:
```bash
npm start
```

## 📡 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Users (`/api/users`)
- `GET /api/users/profile` - Get user profile (Protected)
- `PUT /api/users/profile` - Update user profile (Protected)
- `GET /api/users` - Get all users (Protected/Admin)

### Health Check
- `GET /health` - Server health check

## 🔐 Authentication

This API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 🛠️ Technologies Used

- **Express.js** - Web framework
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variables
- **axios** - HTTP client
- **nodemon** - Development auto-reload

## 📝 Next Steps

1. **Configure Database**: 
   - Choose your database (MongoDB, PostgreSQL, MySQL)
   - Update `config/db.js` with connection logic
   - Implement database models

2. **Implement Service Layer**:
   - Complete the user service functions in `services/user.service.js`
   - Add database queries

3. **Add More Features**:
   - Password reset functionality
   - Email verification
   - Role-based access control
   - File uploads
   - Rate limiting

## 🧪 Testing

```bash
npm test
```

## 📄 License

ISC
