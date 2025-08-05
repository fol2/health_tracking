# Health Tracker

A comprehensive health tracking Progressive Web App (PWA) built with Next.js 15, featuring fasting tracking, weight monitoring, health metrics, and scheduling capabilities.

## Features

### 🍽️ Fasting Tracker
- Multiple fasting types (16:8, 18:6, 20:4, 24h, 36h, 48h, custom)
- Real-time fasting timer with progress visualization
- Session history and statistics
- Pause/resume functionality
- Fasting streaks tracking

### ⚖️ Weight Management
- Weight entry with multiple units (kg, lbs, stone)
- BMI calculation and categorization
- Progress tracking towards target weight
- Visual weight trend charts
- Historical data analysis

### 📊 Health Metrics
- Track multiple health indicators:
  - Blood pressure
  - Heart rate
  - Blood glucose
  - Body temperature
  - Oxygen saturation
  - Sleep hours
  - Water intake
  - Daily steps
  - Energy levels
- Normal range indicators
- Trend analysis

### 📅 Scheduling
- Schedule future fasting sessions
- Recurring fasts (daily, weekly, monthly)
- Calendar view with visual indicators
- Reminder notifications
- Conflict detection
- Auto-start capability

### 📈 Analytics
- Comprehensive dashboards
- Data visualization with charts
- Export data (CSV, JSON, PDF)
- Progress summaries
- Achievement tracking

### 🌓 User Experience
- Dark/Light theme support
- Offline functionality (PWA)
- Mobile-responsive design
- Real-time updates
- Auto-save functionality

### 🔐 Authentication & Security
- Google Sign-In (OAuth)
- Multi-user support
- Secure data storage
- Profile management

## Tech Stack

- **Framework**: Next.js 15.4.5 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **State Management**: Zustand
- **Charts**: Recharts
- **PWA**: next-pwa
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google OAuth credentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/health-tracker.git
cd health-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
health-tracker/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   ├── analytics/    # Analytics components
│   │   ├── auth/         # Authentication components
│   │   ├── fasting/      # Fasting tracker components
│   │   ├── health/       # Health metrics components
│   │   ├── schedule/     # Scheduling components
│   │   └── ui/           # shadcn/ui components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and services
│   ├── store/            # Zustand stores
│   └── types/            # TypeScript types
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── scripts/              # Build scripts
```

## Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fhealth-tracker&env=DATABASE_URL,NEXTAUTH_SECRET,NEXTAUTH_URL,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET)

## Database Schema

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed database documentation.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- Charts by [Recharts](https://recharts.org)# Trigger rebuild
