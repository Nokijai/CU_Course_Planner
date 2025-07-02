# CUHK Course Planner

A comprehensive course planning web application for The Chinese University of Hong Kong (CUHK) students. This application helps students discover courses, build schedules, manage favorites, and validate course conflicts.

## Features

- **Course Search**: Advanced search with filtering by subject, keyword, and instructor
- **Course Details**: Comprehensive course information including schedules, prerequisites, and descriptions
- **Schedule Builder**: Create and manage your course schedule with conflict detection
- **Favorites Management**: Save and organize your favorite courses
- **Schedule Validation**: Real-time conflict detection and validation
- **Export/Import**: Save and share your schedules
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend
- **Node.js** with Express.js
- **CORS** for cross-origin requests
- **Helmet** for security headers
- **Morgan** for request logging
- **Axios** for HTTP requests

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Hot Toast** for notifications

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)

You can check your versions with:
```bash
node --version
npm --version
```

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CU_CourseBrowser
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../client
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the `server` directory:

```bash
cd ../server
touch .env
```

Add the following configuration to the `.env` file:

```env
PORT=5000
NODE_ENV=development
API_BASE_URL=http://localhost:5000
```

## Running the Application

### Option 1: Run Backend and Frontend Separately

#### Start the Backend Server

```bash
cd server
npm start
```

The backend will start on `http://localhost:5000`

#### Start the Frontend Development Server

In a new terminal:

```bash
cd client
npm run dev
```

The frontend will start on `http://localhost:5173`

### Option 2: Run Both with Concurrently (Recommended)

From the root directory, you can run both servers simultaneously:

```bash
# Install concurrently globally (if not already installed)
npm install -g concurrently

# Run both servers
concurrently "cd server && npm start" "cd client && npm run dev"
```

## Accessing the Application

Once both servers are running:

1. **Frontend**: Open your browser and go to `http://localhost:5173`
2. **Backend API**: Available at `http://localhost:5000/api`

## API Endpoints

The backend provides the following API endpoints:

- `GET /api/courses/search?q=<query>&subject=<subject>` - Search courses
- `GET /api/courses/subjects` - Get all available subjects
- `GET /api/courses/<subject>/<code>` - Get specific course details
- `GET /api/courses/academic-groups` - Get academic groups
- `GET /api/courses/validate-schedule` - Validate schedule for conflicts

## Project Structure

```
CU_CourseBrowser/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   └── App.jsx        # Main app component
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── server/                # Backend Node.js application
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic
│   ├── middleware/        # Express middleware
│   ├── config/            # Configuration files
│   └── package.json       # Backend dependencies
├── Data/                  # Course data files
│   ├── courses/           # Individual course JSON files
│   ├── derived/           # Processed data files
│   └── resources/         # Additional resources
└── Tools/                 # Data processing tools
    └── data.ipynb         # Data update pipeline
```

## Development

### Adding New Features

1. **Backend**: Add new routes in `server/routes/` and services in `server/services/`
2. **Frontend**: Add new components in `client/src/components/` and pages in `client/src/pages/`

### Data Updates

The application uses course data from the `Data/` directory. To update course data:

1. Run the data processing pipeline in `Tools/data.ipynb`
2. The processed data will be available in `Data/derived/`
3. Restart the backend server to load new data

### Styling

The application uses Tailwind CSS. To modify styles:

1. Edit `client/src/index.css` for global styles
2. Use Tailwind classes in components
3. Customize Tailwind configuration in `client/tailwind.config.js`

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process using port 5000
   lsof -ti:5000 | xargs kill -9
   
   # Kill process using port 5173
   lsof -ti:5173 | xargs kill -9
   ```

2. **Module Not Found Errors**
   ```bash
   # Clear npm cache and reinstall
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **CORS Issues**
   - Ensure the backend is running on port 5000
   - Check that the frontend is making requests to the correct backend URL

### Debug Mode

To run in debug mode:

```bash
# Backend with debugging
cd server
DEBUG=* npm start

# Frontend with detailed logging
cd client
npm run dev -- --debug
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions, please open an issue in the repository or contact the development team.

---

**Note**: This application is designed for educational purposes and uses publicly available course data from CUHK. Always verify course information with official university sources. 