# MongoDB Atlas Setup Guide

This guide will help you migrate from local MongoDB to MongoDB Atlas (cloud database).

## 🚀 Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account or log in if you already have one
3. Create a new project (e.g., "CUHK Course Planner")

## 🗄️ Step 2: Create a Cluster

1. Click "Build a Database"
2. Choose "FREE" tier (M0)
3. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region close to your users
5. Click "Create"

## 🔐 Step 3: Set Up Database Access

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and password (save these securely!)
5. Set privileges to "Read and write to any database"
6. Click "Add User"

## 🌐 Step 4: Set Up Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production: Add specific IP addresses
5. Click "Confirm"

## 🔗 Step 5: Get Connection String

1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string

## ⚙️ Step 6: Configure Environment Variables

Create a `.env` file in the `server` directory with the following content:

```env
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# Server Configuration
PORT=3002
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,https://*.ngrok-free.app,https://*.ngrok.io

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="CUHK Course Planner <noreply@cuhk-course-planner.com>"

# External Data Source
EXTERNAL_DATA_URL=https://api.cuhk.edu.hk/courses
LOCAL_DATA_PATH=../Data

# Cache Configuration
CACHE_DURATION=3600
```

**Important:** Replace the following in your MONGODB_URI:
- `<username>`: Your database username
- `<password>`: Your database password
- `<cluster>`: Your cluster name
- `<database>`: Your database name (e.g., "cuhk-course-planner")

## 🔧 Step 7: Update Connection String

Your connection string should look like this:
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/cuhk-course-planner?retryWrites=true&w=majority
```

## 🚀 Step 8: Test Connection

1. Start your server:
   ```bash
   cd server
   npm start
   ```

2. Check the console output. You should see:
   ```
   ✅ Connected to MongoDB Atlas
   📊 Database: cuhk-course-planner
   🌐 Environment: development
   ```

## 🔍 Step 9: Verify Data Migration

If you have existing data in your local MongoDB, you'll need to migrate it:

### Option A: Using MongoDB Compass
1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect to your local MongoDB
3. Export collections as JSON
4. Connect to your Atlas cluster
5. Import the JSON files

### Option B: Using mongodump/mongorestore
```bash
# Export from local MongoDB
mongodump --db cuhk-course-planner --out ./backup

# Import to Atlas
mongorestore --uri "mongodb+srv://username:password@cluster.mongodb.net/cuhk-course-planner" ./backup/cuhk-course-planner
```

## 🛡️ Security Best Practices

1. **Environment Variables**: Never commit your `.env` file to version control
2. **Strong Passwords**: Use strong, unique passwords for database users
3. **Network Access**: Restrict IP access in production
4. **Database Users**: Create separate users for different environments
5. **Backup**: Enable automatic backups in Atlas

## 🔧 Troubleshooting

### Connection Issues
- Verify your connection string format
- Check if your IP is whitelisted
- Ensure username/password are correct
- Check if the cluster is running

### Authentication Errors
- Verify database user credentials
- Check user permissions
- Ensure the database name is correct

### Network Issues
- Check your internet connection
- Verify firewall settings
- Try connecting from a different network

## 📊 Monitoring

Once connected, you can monitor your database in the Atlas dashboard:
- **Metrics**: Monitor performance and usage
- **Logs**: View database logs
- **Alerts**: Set up alerts for important events
- **Backups**: Manage automatic backups

## 🚀 Production Deployment

For production deployment:
1. Use environment-specific connection strings
2. Set up proper CORS origins
3. Use strong JWT secrets
4. Enable SSL/TLS
5. Set up monitoring and alerts
6. Configure automatic backups
7. Use connection pooling
8. Set up proper indexes

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `PORT` | Server port | `3002` |
| `NODE_ENV` | Environment | `development` or `production` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `CORS_ORIGIN` | Allowed origins | `http://localhost:5173` |

## ✅ Verification Checklist

- [ ] MongoDB Atlas account created
- [ ] Cluster created and running
- [ ] Database user created with proper permissions
- [ ] Network access configured
- [ ] Connection string obtained
- [ ] Environment variables set
- [ ] Server connects successfully
- [ ] Data migrated (if applicable)
- [ ] Security measures implemented
- [ ] Monitoring configured

## 🆘 Support

If you encounter issues:
1. Check the MongoDB Atlas documentation
2. Review the error messages in your server logs
3. Verify your connection string format
4. Test with MongoDB Compass
5. Check the troubleshooting section above 