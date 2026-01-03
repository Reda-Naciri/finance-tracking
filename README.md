# Finance Tracking Application

A full-stack personal finance tracking application built with .NET 8.0 and React + TypeScript.

## Features

- **Financial Accounts Management**: Create and manage multiple financial accounts (Cash, Bank, Savings, etc.)
- **Transaction Tracking**: Record income and expenses with categories
- **Statistics Dashboard**: View spending by category with beautiful visualizations
- **Monthly Reports**: Track income, expenses, and net balance over time
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend
- .NET 8.0 with Minimal APIs
- Entity Framework Core
- SQL Server / SQLite (configurable)
- Swagger/OpenAPI documentation

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- shadcn/ui components
- Recharts for data visualization

## Quick Start - Local Development

### Prerequisites
- .NET 8.0 SDK
- Node.js 20+ and npm
- SQL Server LocalDB (or use SQLite)

### Backend Setup

```bash
cd Server
dotnet restore
dotnet run
```

Backend will run on: `http://localhost:5235`

### Frontend Setup

```bash
cd Client
npm install
npm run dev
```

Frontend will run on: `http://localhost:5173`

## Local Network Access

To access the app from other devices on your network:

### Backend
Already configured to listen on `http://0.0.0.0:5235`

### Frontend
```bash
cd Client
npm run dev:network
```

Access from other devices: `http://YOUR_LOCAL_IP:8080`

## Cloud Deployment

This application is ready for cloud deployment with Docker support for both frontend and backend.

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.**

### Deployment Options:
1. **Railway** (Recommended) - Easiest, free tier available
2. **Docker Compose** - For VPS or cloud servers
3. **Azure/AWS** - Enterprise deployment

### Quick Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Database Configuration

The application automatically detects the database type from the connection string:

- **SQLite**: Connection string ending with `.db`
- **SQL Server**: All other connection strings

### Development (SQL Server LocalDB)
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=FinanceTrackingDb;Trusted_Connection=True;MultipleActiveResultSets=true"
}
```

### Production (SQLite)
```json
"ConnectionStrings": {
  "DefaultConnection": "Data Source=/app/data/finance.db"
}
```

## Project Structure

```
Finance Tracking/
├── Server/                 # .NET Backend
│   ├── Data/              # DbContext and database configuration
│   ├── Models/            # Entity models
│   ├── Dockerfile         # Backend Docker configuration
│   └── Program.cs         # API endpoints and configuration
├── Client/                # React Frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API service layer
│   │   └── types/        # TypeScript type definitions
│   ├── Dockerfile        # Frontend Docker configuration
│   └── nginx.conf        # Nginx configuration for production
├── docker-compose.yml    # Multi-container orchestration
└── DEPLOYMENT.md         # Detailed deployment guide
```

## API Documentation

When running in development mode, access Swagger UI at:
`http://localhost:5235/swagger`

### Main Endpoints

- `GET /api/financial-accounts` - List all financial accounts
- `POST /api/financial-accounts` - Create new account
- `DELETE /api/financial-accounts/{id}` - Delete account
- `GET /api/transactions` - List transactions (with filters)
- `POST /api/transactions` - Create new transaction
- `GET /api/summary` - Get monthly summary
- `GET /api/total-balance` - Get total balance across all accounts
- `GET /api/categories/{month}/spending` - Get category spending breakdown

## Environment Variables

### Backend
- `ASPNETCORE_ENVIRONMENT` - Environment (Development/Production)
- `ASPNETCORE_URLS` - URLs to listen on
- `ConnectionStrings__DefaultConnection` - Database connection string
- `AllowedOrigins__0`, `AllowedOrigins__1` - CORS allowed origins

### Frontend
- `VITE_API_URL` - Backend API URL

## Development Tips

### Running on Different Ports

Update `Client/package.json` scripts:
```json
"dev:8080": "vite --port 8080 --host"
```

### CORS Configuration

Update `Server/appsettings.json` or `Server/Program.cs` to add allowed origins:
```json
"AllowedOrigins": [
  "http://localhost:5173",
  "http://localhost:8080"
]
```

## Security Considerations

- Default setup uses a single hardcoded user (UserId = 1)
- Add authentication/authorization for multi-user support
- Update CORS settings for production
- Use HTTPS in production
- Implement rate limiting for API endpoints

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is for personal use. Modify as needed for your requirements.

## Support

For deployment help, see [DEPLOYMENT.md](./DEPLOYMENT.md)

For issues, check:
- Backend logs: `docker-compose logs backend`
- Frontend logs: `docker-compose logs frontend`
- Browser console for client-side errors
