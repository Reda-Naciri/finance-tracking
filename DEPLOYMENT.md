# Finance Tracking App - Deployment Guide

This guide will help you deploy your Finance Tracking application to the cloud so it's accessible from anywhere on the internet.

## Deployment Options

We'll cover two deployment strategies:

1. **Railway (Recommended)** - Easiest, free tier available, supports both .NET and static sites
2. **Docker Compose (VPS/Cloud)** - For deployment to your own server with Docker

---

## Option 1: Deploy to Railway (Easiest)

Railway provides free tier hosting and is perfect for full-stack applications.

### Prerequisites
- Create a free account at [Railway.app](https://railway.app)
- Install Railway CLI (optional but recommended):
  ```bash
  npm install -g @railway/cli
  ```

### Step 1: Prepare Your Project

1. Make sure your database uses SQLite instead of SQL Server for easier cloud deployment
2. Push your code to GitHub (Railway can deploy directly from GitHub)

### Step 2: Deploy Backend

1. Go to [Railway.app](https://railway.app) and create a new project
2. Click "Deploy from GitHub repo" or "New Project"
3. Select "Deploy from Dockerfile"
4. Navigate to the `Server` folder
5. Railway will detect the Dockerfile automatically
6. Add these environment variables in Railway dashboard:
   - `ASPNETCORE_ENVIRONMENT` = `Production`
   - `ASPNETCORE_URLS` = `http://0.0.0.0:5235`
   - `ConnectionStrings__DefaultConnection` = `Data Source=/app/data/finance.db`

7. After deployment, Railway will give you a URL like: `https://your-app-backend.railway.app`
8. **Important**: Note this URL - you'll need it for the frontend

### Step 3: Update CORS for Production

Before deploying frontend, you need to update the backend CORS to allow your frontend domain:

1. In Railway dashboard, add environment variable:
   - `AllowedOrigins__0` = `https://your-frontend-url.railway.app`

Or you can update `appsettings.json` in your Server project to include production origins.

### Step 4: Deploy Frontend

1. In Railway, create a new service in the same project
2. Select "Deploy from Dockerfile"
3. Navigate to the `Client` folder
4. Before deploying, update `Client/.env.production`:
   ```
   VITE_API_URL=https://your-app-backend.railway.app/api
   ```
5. Railway will build and deploy your React app
6. You'll get a frontend URL like: `https://your-app-frontend.railway.app`

### Step 5: Update Backend CORS

Go back to your backend service environment variables and update:
- `AllowedOrigins__0` = `https://your-app-frontend.railway.app`

Redeploy the backend service.

### Step 6: Test Your Deployment

Visit your frontend URL and test all functionality:
- Create financial accounts
- Add transactions
- View statistics
- Check that data persists

---

## Option 2: Deploy with Docker Compose (VPS or Cloud Server)

If you have a VPS (like DigitalOcean, Linode, or AWS EC2), you can use Docker Compose.

### Prerequisites
- A server with Docker and Docker Compose installed
- Domain name (optional but recommended)
- SSH access to your server

### Step 1: Update Backend for Production Database

Update `Server/appsettings.Production.json` (create if doesn't exist):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=/app/data/finance.db"
  },
  "AllowedOrigins": [
    "http://your-domain.com",
    "https://your-domain.com"
  ]
}
```

### Step 2: Update Frontend Environment

Update `Client/.env.production`:
```
VITE_API_URL=http://your-server-ip:5235/api
```

Or if you have a domain:
```
VITE_API_URL=https://api.your-domain.com/api
```

### Step 3: Build and Deploy

1. Copy your project to the server via SCP or Git
2. SSH into your server
3. Navigate to the project directory
4. Build and run with Docker Compose:

```bash
# Build the images
docker-compose build

# Start the services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Step 4: Configure Nginx Reverse Proxy (Optional but Recommended)

For production, set up Nginx on your server to:
- Serve both frontend and backend on the same domain
- Enable HTTPS with Let's Encrypt
- Handle SSL certificates

Example Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5235/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 5: Enable HTTPS with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

---

## Option 3: Quick Local Network Deployment

If you just want to make it accessible on your local network:

### Step 1: Update Configuration

1. Update `Client/.env.network`:
   ```
   VITE_API_URL=http://your-local-ip:5235/api
   ```

2. Run backend:
   ```bash
   cd Server
   dotnet run
   ```

3. Run frontend in network mode:
   ```bash
   cd Client
   npm run dev:network
   ```

### Step 2: Access from Network

- Backend: `http://your-local-ip:5235`
- Frontend: `http://your-local-ip:8080`

Anyone on your local network can access these URLs.

---

## Database Considerations

### For Production Deployment:

Consider switching from SQL Server LocalDB to:

1. **SQLite** (Simplest):
   - Update connection string to: `Data Source=/app/data/finance.db`
   - Install package: `Microsoft.EntityFrameworkCore.Sqlite`
   - Update `AppDbContext` to use SQLite

2. **PostgreSQL** (Recommended for scale):
   - Railway offers free PostgreSQL database
   - Update connection string
   - Install package: `Npgsql.EntityFrameworkCore.PostgreSQL`

3. **Azure SQL / AWS RDS** (Enterprise):
   - Keep SQL Server
   - Use cloud-hosted database
   - Update connection string with cloud credentials

---

## Environment Variables Summary

### Backend Environment Variables:
- `ASPNETCORE_ENVIRONMENT` - Set to `Production`
- `ASPNETCORE_URLS` - Set to `http://0.0.0.0:5235`
- `ConnectionStrings__DefaultConnection` - Your database connection string
- `AllowedOrigins__0`, `AllowedOrigins__1`, etc. - Frontend URLs for CORS

### Frontend Environment Variables:
- `VITE_API_URL` - Backend API URL (e.g., `https://your-backend.railway.app/api`)

---

## Troubleshooting

### CORS Errors
- Ensure backend `AllowedOrigins` includes your frontend URL
- Check that URLs match exactly (http vs https, trailing slashes)

### Database Connection Errors
- Verify connection string format
- Ensure database file has write permissions
- Check that database migrations are applied

### Frontend Can't Connect to Backend
- Verify `VITE_API_URL` is correct
- Check that backend is running and accessible
- Use browser DevTools Network tab to inspect requests

### Port Already in Use
- Change ports in `docker-compose.yml`
- Update environment variables accordingly

---

## Security Checklist for Production

- [ ] Use HTTPS (SSL/TLS certificates)
- [ ] Configure proper CORS (don't use wildcard `*` in production)
- [ ] Use environment variables for sensitive data
- [ ] Set up database backups
- [ ] Implement rate limiting
- [ ] Add authentication/authorization if handling sensitive data
- [ ] Enable logging and monitoring
- [ ] Keep dependencies updated

---

## Next Steps

1. Choose your deployment option (Railway recommended for beginners)
2. Follow the steps for your chosen platform
3. Update environment variables with actual URLs
4. Test thoroughly before sharing the URL
5. Set up monitoring and backups

For Railway deployment, start here: https://railway.app
For VPS deployment, DigitalOcean has great tutorials: https://www.digitalocean.com/community/tutorials
