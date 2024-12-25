# Next.js + Hono: Better Authentication

This project integrates Next.js and Hono to provide a robust and efficient authentication solution using the `better-auth` library. Additionally, it uses Drizzle ORM for database management, ShadCN for UI components, Tailwind CSS for styling, and Socket.IO for real-time communication.

---

## Features

- **Next.js**: Frontend framework for building web applications.
- **Hono**: Lightweight web framework for handling authentication.
- **Drizzle ORM**: Type-safe database queries with SQLite.
- **Socket.IO**: Real-time event-based communication.
- **Tailwind CSS**: Utility-first CSS framework.
- **ShadCN**: Pre-styled and customizable UI components.
- **TypeScript**: Ensures type safety and better developer experience.

---

## Getting Started

### Prerequisites

- Node.js 18+
- Bun runtime (preferred package manager and runtime for the project)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Tanim-Bhuiyann/next-hono-better-auth.git
   cd next-hono-better-auth
   ```

2. Install dependencies:

   ```bash
   bun install # For backend dependencies
   npm install # For frontend dependencies
   ```

3. Create a `.env` file at the root of your project and add the following variables:

   ```env
   BETTER_AUTH_URL=http://localhost:3000   # Base URL of your app
   BETTER_AUTH_SECRET=<your_secret>
   TURSO_DATABASE_URL=<your_turso_database_url>
   TURSO_AUTH_TOKEN=<your_turso_auth_token>
   GITHUB_CLIENT_ID=<your_github_client_id>
   GITHUB_CLIENT_SECRET=<your_github_client_secret>
   GOOGLE_CLIENT_ID=<your_google_client_id>
   GOOGLE_CLIENT_SECRET=<your_google_client_secret>
   ```

   Replace `<your_secret>`, `<your_client_id>`, and `<your_client_secret>` with your specific values.

4. Set up the database schema using Drizzle:

   ```bash
   npx drizzle-kit push
   npx drizzle-kit generate
   npx drizzle-kit migrate
   ```

5. Run the development servers:

   - Frontend (Next.js):
     ```bash
     npm run dev
     ```
   - Backend (Hono):
     ```bash
     bun run --hot hono/index.ts
     ```

---

## Scripts

| Command                       | Description                            |
| ----------------------------- | -------------------------------------- |
| `npm run dev`                 | Starts the Next.js development server. |
| `bun run --hot hono/index.ts` | Starts the Hono backend server.        |
| `bun run db:generate`         | Generates Drizzle schema.              |
| `bun run db:migrate`          | Applies database migrations.           |
| `bun run db:studio`           | Opens the Drizzle database studio.     |

---

## Directory Structure

```
.
├── hono/               # Hono server code
├── pages/              # Next.js pages
├── public/             # Static assets
├── styles/             # Global styles
├── drizzle/            # Database-related files
├── components/         # Reusable React components
├── hooks/              # Custom hooks
├── utils/              # Utility functions
└── types/              # TypeScript types
```

---

## Dependencies

### Major Dependencies:

- **[@hono/node-server](https://github.com/honojs/hono)**: Hono server for Node.js.
- **[drizzle-orm](https://github.com/drizzle-team/drizzle-orm)**: Database management.
- **[better-auth](https://github.com/user/better-auth)**: Authentication library.
- **[shadcn](https://shadcn.dev/)**: UI components.
- **[tailwindcss](https://tailwindcss.com)**: CSS framework.
- **[socket.io](https://socket.io/)**: Real-time communication.

### Development Dependencies:

- **[drizzle-kit](https://github.com/drizzle-team/drizzle-kit)**: CLI for managing Drizzle ORM.
- **[typescript](https://www.typescriptlang.org)**: TypeScript language support.

---

## Styling

The project uses Tailwind CSS with the following plugins:

- `tailwind-merge`: Combines utility classes intelligently.
- `tailwindcss-animate`: Adds animations.

---

## Real-Time Communication

Socket.IO is integrated for features like real-time notifications or chat functionalities. The server and client dependencies are included.

---

## Authentication

The `better-auth` library is used with the Hono framework to provide efficient authentication.

---

## Author

Created by [Tanim Bhuiyan](https://github.com/Tanim-Bhuiyann).

