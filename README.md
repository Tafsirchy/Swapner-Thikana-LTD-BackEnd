# shwapner Thikana LTD - Backend

🏗️ **Premium Real Estate Development Platform** - Backend API

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-4.21-black)
![MongoDB](https://img.shields.io/badge/MongoDB-8+-green)

## 🚀 API Documentation

Coming soon!

## ✨ Features

- **RESTful API** - Clean, scalable architecture
- **JWT Authentication** - Secure user authentication
- **Role-based Access** - Customer, Agent, Admin roles
- **MongoDB Atlas** - Cloud database integration
- **File Upload** - Cloudinary integration
- **Email Service** - Nodemailer integration
- **Security** - Helmet, CORS, rate limiting
- **Error Handling** - Comprehensive error management

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.21
- **Database**: MongoDB 8+ with Mongoose
- **Authentication**: JWT + bcrypt
- **File Storage**: Cloudinary
- **Email**: Nodemailer
- **Security**: Helmet, CORS, express-rate-limit
- **Validation**: express-validator

## 📦 Database Models

- **User** - Customer, Agent, Admin with profiles
- **Property** - Listings with location, specs, media
- **Project** - Development projects with unit types
- **Lead** - Inquiry tracking and management
- **Blog** - Content management

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create .env file (see .env.example)
cp .env.example .env

# Run development server
npm run dev

# Run production server
npm start
```

Server will run on [http://localhost:5000](http://localhost:5000)

## 🌍 Environment Variables

Create a `.env` file:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
EMAIL_API_KEY=your_email_api_key
EMAIL_FROM=noreply@shwapnerthikana.com
FRONTEND_URL=your_frontend_url
```

## 📁 Project Structure

```
src/
├── config/           # Configuration files
│   ├── db.js         # MongoDB connection
│   └── cloudinary.js # Cloudinary setup
├── models/           # Mongoose models
│   ├── User.js
│   ├── Property.js
│   ├── Project.js
│   ├── Lead.js
│   └── Blog.js
├── routes/           # API routes
├── controllers/      # Route controllers
├── middlewares/      # Custom middleware
│   ├── auth.middleware.js
│   ├── role.middleware.js
│   └── errorHandler.js
├── utils/            # Utility functions
│   ├── jwt.js
│   ├── slugify.js
│   └── apiResponse.js
├── app.js            # Express app setup
└── server.js         # Server entry point
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login user
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me            - Get current user
```

### Properties
```
GET    /api/properties         - List properties (with filters)
GET    /api/properties/:slug   - Get single property
POST   /api/properties         - Create property (Agent/Admin)
PUT    /api/properties/:id     - Update property
DELETE /api/properties/:id     - Delete property
```

### Projects, Leads, Users, Blogs (Coming in Phase 2)

## 🧪 Testing

```bash
# Test MongoDB connection
node test-db.js

# Run API tests (coming soon)
npm test
```

## 📦 Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

**Note**: Configure environment variables in Vercel dashboard before deployment.

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt (12 rounds)
- CORS protection
- Rate limiting (100 requests/15min)
- Helmet security headers
- Input validation & sanitization
- MongoDB injection prevention

## 🗄️ Database Connection

Successfully connected to MongoDB Atlas:
- **Cluster**: Taftech
- **Database**: shwapner-thikana
- **Status**: ✅ Tested and working

## 🎯 Development Roadmap

- [x] MongoDB models and schemas
- [x] Database connection setup
- [x] Authentication middleware
- [x] Error handling
- [x] Security middleware
- [ ] Authentication endpoints
- [ ] Property CRUD endpoints
- [ ] Project management
- [ ] Lead/inquiry system
- [ ] User management
- [ ] Blog CMS
- [ ] API documentation (Swagger)

## 👥 Company

**shwapner Thikana Ltd** (স্বপ্নের ঠিকানা)  
*Building Dreams, Creating Addresses*

Premium Real Estate Development Company  
Established: 2009  
Location: Dhaka, Bangladesh

## 📄 License

Private - © 2026 shwapner Thikana Ltd

---

**Frontend Repository**: [shwapner-Thikana-LTD-FrontEnd](https://github.com/Tafsirchy/shwapner-Thikana-LTD-FrontEnd)
