# ngrok Setup for Public Testing

This guide will help you set up ngrok to make your CUHK Course Planner application publicly accessible for testing.

## Prerequisites

1. **ngrok Account**: Sign up at [ngrok.com](https://ngrok.com)
2. **ngrok CLI**: Install the ngrok command-line tool
3. **Node.js**: Version 16 or higher
4. **npm**: Package manager

## Installation

### 1. Install ngrok

**Option A: Download from ngrok.com**
```bash
# Download and extract ngrok
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/
```

**Option B: Using npm**
```bash
npm install -g ngrok
```

### 2. Authenticate ngrok
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```
Get your auth token from [ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken)

### 3. Install project dependencies
```bash
# Install root dependencies
npm install

# Install all project dependencies
npm run install-all
```

## Quick Start

### Option 1: Using the provided script (Recommended)
```bash
./start-ngrok.sh
```

This script will:
- Start the backend server on port 3002
- Start the frontend server on port 5173
- Start ngrok tunnel to the frontend
- Display all URLs for access

### Option 2: Manual setup
```bash
# Terminal 1: Start backend
cd server
npm start

# Terminal 2: Start frontend
cd client
npm run dev

# Terminal 3: Start ngrok
ngrok http 5173
```

## Accessing Your Application

After running the setup, you'll have access to:

- **Local Frontend**: http://localhost:5173
- **Local Backend API**: http://localhost:3002
- **Public URL**: https://[random-id].ngrok-free.app (displayed by ngrok)
- **ngrok Dashboard**: http://localhost:4040

## Troubleshooting

### 1. CORS Errors (403 Forbidden)

If you see "blocked request" or CORS errors:

**Solution**: The application has been configured to allow ngrok domains. Make sure:
- You're using the updated CORS configuration
- The backend server is running on port 3002
- The frontend is running on port 5173

### 2. ngrok Free Tier Limitations

The free ngrok plan has some limitations:
- **Session timeout**: Tunnels close after 2 hours of inactivity
- **Rate limiting**: Limited requests per minute
- **Random URLs**: URLs change each time you restart ngrok

**Solutions**:
- Upgrade to a paid plan for static URLs
- Use the ngrok dashboard to monitor usage
- Restart ngrok if you hit rate limits

### 3. Port Already in Use

If you get "port already in use" errors:

```bash
# Kill processes using the ports
sudo lsof -ti:3002 | xargs kill -9
sudo lsof -ti:5173 | xargs kill -9
```

### 4. ngrok Not Found

If ngrok command is not found:

```bash
# Check if ngrok is installed
which ngrok

# If not found, add to PATH or reinstall
export PATH=$PATH:/path/to/ngrok
```

## Configuration Files

### Backend CORS Configuration
The server has been updated to allow ngrok domains:
- `server/config/env.js`: CORS origins configuration
- `server/app.js`: CORS middleware with ngrok support

### Frontend Configuration
The Vite configuration allows external access:
- `client/vite.config.js`: Host configuration for ngrok

## Security Considerations

⚠️ **Important**: When using ngrok for public testing:

1. **Temporary Access**: Only use for testing, not production
2. **Data Privacy**: Be aware that your data is accessible publicly
3. **Rate Limiting**: Monitor ngrok usage to avoid hitting limits
4. **Session Management**: ngrok URLs change on restart

## Advanced Configuration

### Custom ngrok Configuration

Create a `ngrok.yml` file in your home directory:

```yaml
version: "2"
authtoken: YOUR_AUTH_TOKEN
tunnels:
  cuhk-course-planner:
    proto: http
    addr: 5173
    subdomain: your-custom-subdomain  # Requires paid plan
```

### Environment Variables

You can set environment variables for the server:

```bash
# Create server/.env file
PORT=3002
NODE_ENV=development
CORS_ORIGIN=["http://localhost:5173","https://*.ngrok-free.app"]
```

## Monitoring and Debugging

### ngrok Dashboard
Access the ngrok dashboard at http://localhost:4040 to:
- View request logs
- Monitor traffic
- Debug issues
- Check rate limits

### Server Logs
Monitor your server logs for:
- CORS errors
- API requests
- Error messages

### Browser Developer Tools
Use browser dev tools to:
- Check network requests
- Debug CORS issues
- Monitor console errors

## Support

If you encounter issues:

1. Check the ngrok dashboard for errors
2. Review server logs for CORS issues
3. Ensure all services are running on correct ports
4. Verify ngrok authentication is working

For more help, refer to:
- [ngrok Documentation](https://ngrok.com/docs)
- [CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Vite Configuration](https://vitejs.dev/config/) 