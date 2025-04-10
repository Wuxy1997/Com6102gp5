# Health Tracker

An AI-powered health tracking application built with Next.js, helping users manage their health data and receive personalized recommendations.

## Features

- 🏃‍♂️ Exercise Activity Tracking
- 🍎 Diet and Nutrition Management
- 💪 Health Data Monitoring
- 🤖 AI-powered Recommendations (using Ollama)
- 📊 Data Visualization
- 🌙 Dark Mode Support
- 🌐 Multi-language Support
- 📱 Responsive Design
- 🔐 User Authentication
- 📈 Progress Tracking

## System Requirements

- Docker and Docker Compose
- Node.js 18+ (for development)
- Minimum System Specs:
  - CPU: 2 cores
  - RAM: 4GB
  - Storage: 10GB available space

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, Chart.js
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **AI**: Ollama (tinyllama model)
- **Containerization**: Docker

## Quick Start

1. Clone the repository:
```bash
git clone <repository-url>
cd repository-name
```

2. Start the services:
```bash
docker-compose up -d
```

3. Download the AI model:
```bash
docker exec -it hq_ollama_1 ollama pull tinyllama
```

4. Access the application:
Open your browser and visit http://localhost:3000

## Environment Configuration

Configure the following environment variables in `docker-compose.yml`:

- `MONGODB_URI`: MongoDB connection string
- `OLLAMA_HOST`: Ollama service address
- `NEXTAUTH_SECRET`: NextAuth secret key
- `NEXTAUTH_URL`: NextAuth URL

## Project Structure

```
health-tracker/
├── app/                    # Next.js application code
│   ├── api/               # API routes
│   ├── components/        # React components
│   └── ...
├── lib/                   # Utilities and services
├── public/                # Static assets
├── docker-compose.yml     # Docker configuration
└── Dockerfile            # Docker build file
```

## Development Guide

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Database Management

- MongoDB Express UI: http://localhost:8081
- Default database: health_app
- Main collections:
  - users
  - sessions
  - foodRecords
  - exerciseRecords
  - healthData

## API Endpoints

- `/api/auth/*` - Authentication endpoints
- `/api/users/*` - User management
- `/api/ai` - AI recommendations
- `/api/health-data` - Health data management
- `/api/exercise` - Exercise tracking
- `/api/nutrition` - Nutrition tracking

## Troubleshooting

1. AI Service Returns 500 Error:
   - Check Ollama service status
   - Verify model installation
   - Monitor system resource usage

2. Database Connection Issues:
   - Validate MongoDB connection string
   - Check database service status
   - Verify network connectivity

3. Clean Docker Resources:
```bash
docker-compose down
docker system prune -a --volumes  # Warning: This will remove all unused Docker resources, including AI models
```

