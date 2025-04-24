# Sentro - AI-Powered Impact News Aggregator

Sentro is a sophisticated news aggregator platform that collects trending impact news from multiple sources every 15 minutes, builds original articles, and uses an AI-driven algorithm to rank their relevance based on user-defined criteria.

## Features

- **Personalized News Feed**: Customized news articles based on user preferences
- **Intelligent Ranking**: AI-driven algorithm to prioritize relevant impact content
- **User Onboarding**: In-depth onboarding process to capture user preferences
- **Admin Dashboard**: Comprehensive admin tools for user management and stats tracking
- **Responsive Design**: Sleek, futuristic interface that works across all devices

## Tech Stack

- **Frontend**: React + Vite with TypeScript
- **Styling**: TailwindCSS
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Animation**: Framer Motion
- **News API**: NewsAPI.org

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and add your Supabase credentials
3. Install dependencies: `npm install`
4. Run the development server: `npm run dev`

## Project Structure

- `/src/api`: API integration with NewsAPI
- `/src/components`: Reusable UI components
- `/src/contexts`: Context providers for global state
- `/src/pages`: Main application pages
- `/src/services`: Business logic services
- `/src/types`: TypeScript type definitions
- `/src/utils`: Utility functions
- `/supabase`: Supabase migrations and edge functions

## Supabase Setup

1. Create a new Supabase project
2. Run the migration SQL script in `/supabase/migrations`
3. Deploy the edge function for news aggregation

## Target Audience

- Impact investors
- Social entrepreneurs
- Nonprofit organizations
- Corporate sustainability professionals
- Community leaders
- Changemakers

## License

MIT