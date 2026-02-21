# TanStack Start Application

A modern, full-stack web application built with TanStack Start framework, featuring server-side rendering, type-safe routing, and integrated database management.

## 📋 Project Overview

This repository contains a production-ready TanStack Start application that combines powerful modern web technologies to deliver a fast, type-safe, and scalable web application.

## 🛠️ Technology Stack

### Core Framework
- **[TanStack Start](https://tanstack.com/start)** - A full-stack React meta-framework for building modern web applications with integrated server-side rendering and API routes

### Frontend
- **React** - UI library for building interactive components
- **TypeScript** - Type-safe development experience
- **Vite** - Lightning-fast build tool and dev server

### Backend
- **Node.js** - JavaScript runtime for server-side code
- **Prisma** - Modern ORM for database access and management

### Build & Development Tools
- **Vite** - High-performance build tool with instant HMR (Hot Module Replacement)
- **TypeScript** - Static type checking for both client and server code

### Database
- **Prisma ORM** - Declarative data modeling with auto-generated migrations
- **Prisma Configuration** (prisma.config.ts) - Custom Prisma setup

## 📁 Project Structure

```
tanstack-start-app/
├── src/
│   ├── components/          # Reusable React components
│   ├── routes/              # File-based routing with TanStack Router
│   ├── server/              # Server-side code and API handlers
│   ├── router.tsx           # Router configuration
│   └── routeTree.gen.ts     # Auto-generated route tree (do not edit)
├── prisma/                  # Database configuration and migrations
├── generated/               # Generated code (do not edit)
├── vite.config.ts          # Vite build configuration
├── tsconfig.json           # TypeScript configuration
├── prisma.config.ts        # Prisma configuration
├── package.json            # Project dependencies
└── package-lock.json       # Locked dependency versions
```

## 🚀 Key Features

- **Full-Stack TypeScript**: Type safety across client and server
- **Server-Side Rendering**: Improved performance and SEO
- **File-Based Routing**: Automatic route generation from file structure
- **Hot Module Replacement**: Instant feedback during development
- **Database Integration**: Prisma ORM for seamless database operations
- **Type-Safe API Routes**: Automatic API endpoint generation with type inference

## 📦 Dependencies

Key packages used in this project:
- `@tanstack/start` - Core framework
- `@tanstack/react-router` - Client-side routing
- `prisma` - Database ORM
- `@prisma/client` - Prisma runtime client
- `typescript` - Type checking
- `vite` - Build tool
- `react` and `react-dom` - UI library

For a complete list of dependencies, see `package.json`.

## 🏃 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/CarlosEspinosa88/tanstack-start-app.git
cd tanstack-start-app

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

The application will be available at `http://localhost:5173` (Vite default port).

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Open Prisma Studio (database GUI)
npx prisma studio
```

## 🔧 Configuration Files

- **`vite.config.ts`** - Vite build configuration, including TanStack Start plugin
- **`tsconfig.json`** - TypeScript compiler options and strict type checking settings
- **`prisma.config.ts`** - Custom Prisma ORM configuration
- **`prisma/`** - Prisma schema definitions and migrations

## 🌐 Routing

The application uses TanStack Router with file-based routing. Routes are automatically generated from the file structure in the `src/routes/` directory. The `src/routeTree.gen.ts` file is auto-generated and should not be manually edited.

## 🗄️ Database

Database configuration is managed through Prisma:
- Define your data models in `prisma/schema.prisma`
- Migrations are stored in `prisma/migrations/`
- Use Prisma Client in your API routes for database operations

## 📝 Available Scripts

Check your `package.json` for available npm scripts:

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🔐 TypeScript

This project uses strict TypeScript settings for maximum type safety. Both client and server code are fully typed.

## 📚 Documentation & Resources

- [TanStack Start Documentation](https://tanstack.com/start/latest)
- [TanStack Router Documentation](https://tanstack.com/router/latest)
- [React Documentation](https://react.dev)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vite Documentation](https://vitejs.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## 🤝 Contributing

Feel free to fork this repository and create pull requests for any improvements.

## 📄 License

This project is open source. Check the repository for license information.

## 👤 Author

Created by [Carlos Espinosa](https://github.com/CarlosEspinosa88)

---

**Last Updated:** February 2026

Built with ❤️ using TanStack Start