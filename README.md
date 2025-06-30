# 🎬 Movidex - Movie Discovery & Management Platform

A full-stack movie discovery and management platform built with React, Node.js, and MongoDB. Features user authentication, movie browsing, watchlist management, and an admin panel for content management.

![Movidex Banner](https://img.shields.io/badge/Movidex-Movie%20Platform-blue?style=for-the-badge&logo=movie)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-8.16.0-47A248?style=flat-square&logo=mongodb)

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🎯 User Features
- **User Authentication**: Secure login/registration with JWT tokens
- **Movie Discovery**: Browse movies with search and filtering
- **Watchlist Management**: Add/remove movies to personal watchlist
- **Movie Details**: View detailed movie information and reviews
- **Rating System**: Rate movies and see average ratings
- **Review System**: Write and read movie reviews
- **Responsive Design**: Works seamlessly on desktop and mobile

### 🔧 Admin Features
- **Admin Dashboard**: Manage all movies in the system
- **Movie Management**: Add, edit, and delete movies
- **Content Control**: Full CRUD operations for movie content
- **Secure Access**: Role-based authentication for admin functions

### 🛡️ Security Features
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt encryption for user passwords
- **Role-Based Access**: Different permissions for users and admins
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Cross-origin resource sharing configuration

## 🏗️ Architecture

```
Movidex/
├── movidex/                 # User-facing React application
├── movidex-admin/           # Admin React application
├── movidex-api/             # Node.js/Express backend API
└── json files/              # Sample data files
```

### System Architecture
- **Frontend**: React applications (User + Admin)
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Structure**: Modular component-based architecture

## 🛠️ Tech Stack

### Frontend
- **React 19.1.0** - User interface library
- **React Router DOM 6.22.3** - Client-side routing
- **JS-Cookie 3.0.5** - Cookie management
- **CSS3** - Styling and animations

### Backend
- **Node.js** - JavaScript runtime
- **Express.js 5.1.0** - Web application framework
- **MongoDB 8.16.0** - NoSQL database
- **Mongoose 8.16.0** - MongoDB object modeling
- **JWT 9.0.2** - JSON Web Token authentication
- **Bcryptjs 3.0.2** - Password hashing
- **CORS 2.8.5** - Cross-origin resource sharing
- **Dotenv 16.5.0** - Environment variable management

### Development Tools
- **React Scripts 5.0.1** - Create React App scripts
- **Testing Library** - Component testing utilities
- **ESLint** - Code linting and formatting

## 🚀 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/movidex.git
cd movidex
```

### Step 2: Install Dependencies

#### Backend API
```bash
cd movidex-api
npm install
```

#### User Frontend
```bash
cd ../movidex
npm install
```

#### Admin Frontend
```bash
cd ../movidex-admin
npm install
```

### Step 3: Database Setup
1. Start MongoDB service
2. Create a database named `movidex`
3. The application will automatically create collections

### Step 4: Environment Configuration

Create `.env` file in `movidex-api/` directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/movidex
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Backend server port | 5000 | Yes |
| `MONGO_URI` | MongoDB connection string | - | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | - | Yes |

### Database Collections
- `user` - User accounts and authentication data
- `movieslist` - Movie information and metadata

## 🎮 Usage

### Starting the Application

#### 1. Start Backend API
```bash
cd movidex-api
npm start
# Server will run on http://localhost:5000
```

#### 2. Start User Frontend
```bash
cd movidex
npm start
# Application will run on http://localhost:3000
```

#### 3. Start Admin Frontend
```bash
cd movidex-admin
npm start
# Admin panel will run on http://localhost:3001
```

### User Workflow
1. **Register/Login**: Create account or sign in
2. **Browse Movies**: View movie catalog with search and filters
3. **Manage Watchlist**: Add/remove movies to personal watchlist
4. **Rate & Review**: Share opinions on movies
5. **View Details**: Explore comprehensive movie information

### Admin Workflow
1. **Admin Login**: Access admin panel with admin credentials
2. **Dashboard**: View all movies in the system
3. **Add Movies**: Create new movie entries
4. **Edit Movies**: Update existing movie information
5. **Delete Movies**: Remove movies from the system

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/users/register`
Register a new user account.
```json
{
  "username": "string",
  "password": "string (min 12 characters)"
}
```

#### POST `/api/users/login`
Authenticate user and receive JWT token.
```json
{
  "username": "string",
  "password": "string"
}
```

### Movie Endpoints

#### GET `/api/movies`
Get all movies (requires authentication).
```
Headers: Authorization: Bearer <jwt_token>
```

#### GET `/api/movies/:id`
Get specific movie details.
```
Headers: Authorization: Bearer <jwt_token>
```

#### POST `/api/movies/:id/review`
Add review and rating to movie (requires authentication).
```json
{
  "text": "string",
  "rating": "number (1-5)"
}
```

### Admin Endpoints

#### POST `/api/movies`
Add new movie (admin only).
```json
{
  "title": "string",
  "genre": "string",
  "rating": "number",
  "image": "string",
  "description": "string"
}
```

#### PUT `/api/movies/:id`
Update movie (admin only).
```json
{
  "title": "string",
  "genre": "string",
  "rating": "number",
  "image": "string",
  "description": "string"
}
```

#### DELETE `/api/movies/:id`
Delete movie (admin only).

### Watchlist Endpoints

#### GET `/api/users/:id/watchlist`
Get user's watchlist (requires authentication).

#### POST `/api/users/:id/watchlist`
Update user's watchlist (requires authentication).
```json
{
  "watchlist": ["movie_id_1", "movie_id_2"]
}
```

## 📁 Project Structure

```
movidex/
├── movidex/                          # User Frontend
│   ├── public/
│   │   ├── images/                   # Movie poster images
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login/               # Authentication components
│   │   │   ├── Register/            # Registration components
│   │   │   ├── Moviefile/           # Movie-related components
│   │   │   ├── Header.js            # Navigation header
│   │   │   └── Footer.js            # Page footer
│   │   ├── App.js                   # Main application component
│   │   ├── index.js                 # Application entry point
│   │   └── styles.css               # Global styles
│   └── package.json
│
├── movidex-admin/                    # Admin Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminDashboard.js    # Admin dashboard
│   │   │   ├── AddMovie.js          # Add movie form
│   │   │   ├── EditMovie.js         # Edit movie form
│   │   │   ├── LoginPage.js         # Admin login
│   │   │   ├── AdminRoute.js        # Route protection
│   │   │   └── Navbar.js            # Admin navigation
│   │   ├── App.js                   # Admin application
│   │   └── index.js                 # Admin entry point
│   └── package.json
│
├── movidex-api/                      # Backend API
│   ├── middleware/
│   │   └── auth.js                  # JWT authentication middleware
│   ├── models/
│   │   ├── User.js                  # User data model
│   │   └── Movies.js                # Movie data model
│   ├── routes/
│   │   ├── userRoutes.js            # User authentication routes
│   │   └── moviesRoutes.js          # Movie management routes
│   ├── server.js                    # Express server setup
│   └── package.json
│
├── json files/                       # Sample Data
│   ├── movies.json                  # Sample movie data
│   └── userData.json                # Sample user data
│
└── README.md                        # Project documentation
```

## 🔧 Development

### Available Scripts

#### User Frontend (`movidex/`)
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run eject      # Eject from Create React App
```

#### Admin Frontend (`movidex-admin/`)
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
```

#### Backend API (`movidex-api/`)
```bash
npm start          # Start server
```

### Code Style
- Follow ESLint configuration
- Use consistent indentation (2 spaces)
- Write meaningful commit messages
- Test components before committing

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Error
```
Error: MongoDB connection failed
```
**Solution**: Ensure MongoDB is running and connection string is correct.

#### JWT Token Issues
```
Error: Invalid token
```
**Solution**: Check JWT_SECRET in environment variables and token expiration.

#### Port Already in Use
```
Error: EADDRINUSE
```
**Solution**: Change PORT in .env file or kill existing process.

#### CORS Errors
```
Error: CORS policy blocked
```
**Solution**: Verify CORS configuration in server.js.

### Performance Optimization
- Use React.memo for expensive components
- Implement lazy loading for routes
- Optimize images and assets
- Enable MongoDB indexing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **D DILLI BABU** - *SRMIST* - [GitHub]([https://github.com/yourusername](https://github.com/dillibabu15))

## 🙏 Acknowledgments

- React team for the amazing framework
- MongoDB for the robust database solution
- Express.js community for the web framework
- All contributors and supporters

## 📞 Support

If you have any questions or need support:

- Create an issue in the GitHub repository
- Contact: dillidefe@gmail.com

---

⭐ **Star this repository if you found it helpful!**

Made with ❤️ by [D DILLI BABU]
