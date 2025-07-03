# Auto Finance Carsales System

## Features
- Vehicle inventory management
- User authentication (JWT)
- Admin dashboard
- Image uploads (Cloudinary)
- Responsive frontend

## Installation

1. Clone the repository
2. Create `.env` file from `.env.template`
3. Run `docker-compose up --build`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/vehicles` | GET | Get all vehicles |
| `/api/v1/vehicles` | POST | Create new vehicle (Admin only) |
| `/api/v1/auth/login` | POST | User login |
| `/api/v1/auth/register` | POST | User registration |

## Development

```bash
cd backend
npm install
npm run dev

cd ../frontend
# Use any static server (e.g., Live Server in VSCode)