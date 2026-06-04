# Pet Sitter Server

Backend API for a pet sitter service built with Node.js, Express, TypeScript, and Prisma.

## Features

- User authentication and authorization
- Pet sitter and service request management
- Dog and sitter profile management
- Payment processing with Stripe and webhook support
- Push notifications via Firebase Admin
- Email delivery with SMTP/Brevo
- Real-time chat image support
- Reviews and ratings
- File uploads via Cloudinary / AWS S3 / DigitalOcean Spaces
- Twilio integration for messaging/calls

## Project Structure

- `src/app` - Express app and route setup
- `src/app/modules` - Feature modules: Auth, User, Sitter, Dog, Payment, Review, Notification, ServiceRequest, Chat Image
- `src/config` - Environment configuration loader
- `src/shared` - Shared utilities, services, Firebase, Stripe, email, websocket helpers
- `src/errors` - Centralized error handling
- `src/helpars` - Helper utilities
- `src/server.ts` - Server bootstrap and start logic
- `src/app.ts` - Express application setup

## Getting Started

### Requirements

- Node.js 18+
- npm
- PostgreSQL / MySQL / MongoDB (depending on Prisma schema and configuration)

### Install

```bash
npm install
```

### Setup

1. Copy `.env.example` to `.env`
2. Fill in required environment variables
3. Generate Prisma client

```bash
npm run postinstall
```

### Run in development

```bash
npm run dev
```

### Build and run production

```bash
npm run build
npm start
```

## Environment Variables

Store all secrets in `.env` and do not commit it. Important env variables include:

- `PORT`
- `NODE_ENV`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `EMAIL`
- `APP_PASS`
- `BREVO_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `DO_SPACE_ACCESS_KEY`
- `DO_SPACE_SECRET_KEY`

You can also provide a full Firebase service account JSON via `FIREBASE_SERVICE_ACCOUNT_JSON`.

## Notes

- The repo uses `.env` for configuration and `.gitignore` excludes `.env`.
- Secrets should never be stored directly in source files.
- If you add new environment-based integrations, update `.env.example` accordingly.

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript
- `npm start` - Run compiled production server
- `npm run generate` - Generate new module scaffolding
