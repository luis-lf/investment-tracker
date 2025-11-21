# Investment Tracker

A comprehensive investment tracking application for managing portfolios across Brazil and USA, with tax reporting capabilities and multi-currency support.

## Features

- 📊 **Portfolio Management**: Track investments in both Brazil and USA
- 💱 **Multi-Currency Support**: Handle BRL and USD with real-time exchange rates
- 📈 **Monthly Updates**: Excel-like interface for updating investment values
- 🎯 **Tax Reporting**: Generate tax reports for both Brazilian and US tax requirements
- 📱 **Modern UI**: Built with React and Ant Design for a responsive experience
- 🔒 **User Authentication**: Secure JWT-based authentication with user management
- 📚 **API Documentation**: Interactive Swagger/OpenAPI documentation

## Tech Stack

### Backend
- Node.js + TypeScript
- Express.js
- SQLite (via Knex.js)
- JWT ready for authentication

### Frontend
- React 18 + TypeScript
- Ant Design (antd) UI Framework
- React Query for data fetching
- Vite for fast development

## Project Structure

```
investment-tracker/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── services/        # Business logic
│   │   ├── repositories/    # Data access layer
│   │   ├── database/        # Migrations and DB config
│   │   └── utils/           # Helper functions
│   └── package.json
├── frontend/                # React application
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── services/       # API services
│   │   └── App.tsx         # Main application
│   └── package.json
└── shared/                  # Shared TypeScript types
    └── types/
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd investment-tracker
```

2. Install backend dependencies:
```bash
cd backend
npm install
cp .env.example .env
```

3. **Important**: Update the JWT_SECRET in `.env`:
```bash
# Generate a secure random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy the output and update JWT_SECRET in .env
```

4. Set up the database:
```bash
npm run migrate
```

5. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the Application

#### Development Mode

1. Start the backend server:
```bash
cd backend
npm run dev
# Server runs on http://localhost:3001
```

2. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

3. Open your browser:
   - Frontend: `http://localhost:3000`
   - API Documentation: `http://localhost:3001/api-docs`
   - Backend API: `http://localhost:3001/api/v1`

#### Production Build

1. Build the backend:
```bash
cd backend
npm run build
npm start
```

2. Build the frontend:
```bash
cd frontend
npm run build
npm run preview
```

## Usage Guide

### 1. Dashboard
- View portfolio summary across both countries
- See total values in BRL and USD
- Monitor month-over-month changes
- Track upcoming investment maturities

### 2. Investments Management
- Add new investments (stocks, bonds, CDBs, etc.)
- Edit existing investments
- Mark investments as completed/sold
- Filter by country, status, or account

### 3. Monthly Updates
- Update all investment values for the current month
- Similar workflow to Excel sheets
- Automatic exchange rate calculations
- Bulk save functionality

### 4. Tax Reports (Coming Soon)
- Generate year-end tax reports
- Calculate Brazilian tax obligations
- Export data for US tax reporting (Form 8938, FBAR)
- Track foreign tax credits

## Investment Types Supported

### Brazil
- CDB (Certificado de Depósito Bancário)
- LCI/LCA (Letras de Crédito)
- Renda Fixa (IPCA, Pós, Pré)
- Fundos de Investimento
- Ações (Stocks)
- Tesouro Direto

### USA
- Stocks
- Bonds
- Money Market Funds
- Brokerage Accounts
- Bank Accounts

## Data Migration from Excel

To import your historical Excel data:

1. Format your Excel data to match the expected structure
2. Use the Import/Export feature (coming soon)
3. Or use the provided migration scripts

## Authentication

The API now requires authentication for all investment-related endpoints. Here's how to get started:

### 1. Register a New User
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

### 2. Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

Response includes a JWT token:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Use Token for API Requests
Include the token in the Authorization header:
```bash
Authorization: Bearer <your-token-here>
```

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## API Documentation

Interactive API documentation is available via Swagger UI:
- **URL**: `http://localhost:3001/api-docs`
- **Features**:
  - Try out API endpoints directly from the browser
  - View request/response schemas
  - Test authentication flows
  - View all available endpoints with detailed descriptions

### Authentication Endpoints
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login and receive JWT token
- `GET /api/v1/auth/verify` - Verify token validity
- `GET /api/v1/auth/profile` - Get current user profile
- `PUT /api/v1/auth/profile` - Update user profile
- `POST /api/v1/auth/change-password` - Change password

### Investment Endpoints (Authentication Required)
- `GET /api/v1/investments` - List all investments
- `POST /api/v1/investments` - Create new investment
- `GET /api/v1/investments/:id` - Get investment by ID
- `PUT /api/v1/investments/:id` - Update investment
- `DELETE /api/v1/investments/:id` - Delete investment
- `POST /api/v1/investments/:id/mark-done` - Mark as completed
- `GET /api/v1/investments/summary` - Get investments summary
- `GET /api/v1/investments/upcoming-maturities` - Get upcoming maturities

### Snapshot Endpoints (Authentication Required)
- `GET /api/v1/snapshots/monthly` - Get monthly snapshots
- `GET /api/v1/snapshots/investment/:id` - Get snapshots for investment
- `POST /api/v1/snapshots` - Create snapshot
- `POST /api/v1/snapshots/bulk-update` - Bulk update values

### Dashboard Endpoints (Authentication Required)
- `GET /api/v1/dashboard/summary` - Get dashboard summary
- `GET /api/v1/dashboard/evolution` - Get portfolio evolution
- `GET /api/v1/dashboard/allocation` - Get asset allocation

### Exchange Rate Endpoints (Authentication Required)
- `GET /api/v1/exchange-rates/current` - Get current rate
- `GET /api/v1/exchange-rates/history` - Get historical rates
- `POST /api/v1/exchange-rates` - Update exchange rate

### Tax Endpoints (Authentication Required)
- `GET /api/v1/tax/report` - Generate tax report (coming soon)
- `GET /api/v1/tax/events` - Get taxable events (coming soon)

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=3001
DATABASE_PATH=./data/investments.db
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your-secret-key
```

## Database Schema

The application uses SQLite with the following main tables:
- `investments` - Core investment records
- `portfolio_snapshots` - Monthly value snapshots
- `exchange_rates` - Historical exchange rates
- `tax_events` - Taxable events tracking
- `users` - User accounts (for future multi-user support)

## Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Input validation on all endpoints
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ CORS configuration
- ✅ Helmet.js security headers
- ✅ SQL injection protection via parameterized queries

## Future Enhancements

- [x] Multi-user support with authentication ✅
- [x] Comprehensive API documentation ✅
- [ ] Automated price updates via financial APIs
- [ ] Advanced analytics and charts
- [ ] Mobile application
- [ ] Cloud backup and sync
- [ ] Integration with Brazilian banks/brokers
- [ ] Automated tax form generation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please open an issue in the GitHub repository.
