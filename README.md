# Lost & Found Management System

A comprehensive, full-stack web application designed to facilitate the reporting, tracking, and claiming of lost and found items. Built with modern web technologies, this platform offers a seamless experience for users and a robust management dashboard for administrators.

## 🚀 Features

- **User Authentication**: Secure login and registration powered by NextAuth.js.
- **Report Items**: Users can easily report lost or found items with detailed descriptions and images.
- **Claim Items**: Integrated claiming system allowing users to submit proof of ownership for found items.
- **Admin Dashboard**: Dedicated admin panel for managing users, monitoring claims, reviewing reports, and tracking system logs.
- **User Dashboard & History**: Users can track the status of their reported items and claims.
- **Automated Notifications**: Email alerts for claim updates and system notifications.
- **Secure & Optimized**: Rate limiting on API routes and comprehensive data validation.

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router), React, TypeScript, CSS (Global & Module-based)
- **Backend**: Next.js API Routes (Serverless Functions)
- **Database**: MongoDB (via Mongoose)
- **Authentication**: NextAuth.js
- **Styling**: Custom CSS
- **Code Quality**: ESLint, TypeScript

## 📁 Project Structure

```text
lost-n-found-dbms-main/
├── public/                 # Static assets (SVGs, Favicons)
├── src/
│   ├── app/                # Next.js App Router (Pages & API Routes)
│   │   ├── add/            # Add/Report new items
│   │   ├── admin/          # Admin dashboard interface
│   │   ├── api/            # Backend API routes (auth, claims, items, reports, user)
│   │   ├── history/        # User activity history
│   │   └── item/           # Dynamic item details pages
│   ├── components/         # Reusable React components (Navbar, SessionWrapper)
│   ├── lib/                # Utility functions (MongoDB connection, Email, Rate Limiting, Validation)
│   └── models/             # Mongoose database schemas (AdminLog, Claim, Item, ItemReport)
├── .env.example            # Environment variables template
├── next.config.ts          # Next.js configuration
├── package.json            # Project dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## ⚙️ Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)

### Installation

1. **Clone the repository** (if applicable):
   ```bash
   git clone <repository-url>
   cd lost-n-found-dbms-main
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Copy the example environment file and configure it with your credentials.
   ```bash
   cp .env.example .env.local
   ```
   *Make sure to populate your `.env.local` with your MongoDB URI, NextAuth secret, and Email SMTP credentials.*

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## 🗄️ Database Models

- **Item**: Stores details of lost or found items (title, description, location, status, etc.).
- **Claim**: Manages user claims on found items, including verification status.
- **ItemReport**: Handles specific reports or flags related to items.
- **AdminLog**: Tracks administrative actions for accountability and auditing.

## 🛡️ Security & Validation

- **Rate Limiting**: API endpoints are protected against abuse using custom rate-limiting middleware (`src/lib/rateLimit.ts`).
- **Validation**: Strict server-side and client-side data validation (`src/lib/validation.ts`) to ensure data integrity before database insertion.
- **Admin Authentication**: Distinct authentication checks (`src/lib/adminAuth.ts`) to restrict sensitive operations.

