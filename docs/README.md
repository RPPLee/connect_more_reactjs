# Connect More - Event Platform

Connect More is a modern web application for event management, discovery, and registration. The platform allows users to browse upcoming events, register for events, join waitlists, and for organizers to create and manage their events.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Feature Modules](#feature-modules)
- [Codebase Map](#codebase-map)
- [API Documentation](#api-documentation)
- [Database Structure](#database-structure)

## Overview

Connect More is built as a React application with TypeScript, using modern web development tools and practices. The application enables:

- Event discovery by category, location, and other filters
- Event registration and waitlist functionality
- Featured and super-featured event promotion
- User authentication and account management
- Organizer profiles and event management

The application is designed to be responsive, accessible, and provide a seamless user experience across devices.

## Architecture

The application follows the MVVM (Model-View-ViewModel) architectural pattern, divided into distinct layers:

1. **Domain Layer** - Contains the core data models and business logic
2. **Data Layer** - Handles API communication and data persistence
3. **Application Layer** - Manages application state and business operations using Zustand
4. **Presentation Layer** - Contains React components for UI rendering

### Technology Stack

- **Frontend**: React 19, TypeScript, TailwindCSS
- **State Management**: Zustand
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Backend**: AWS Lambda functions, API Gateway
- **Database**: PostgreSQL with materialized views

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/connect_more_reactjs.git
   cd connect_more_reactjs
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) to view the application in your browser.

### Build for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Feature Modules

### Events

The Events module is the core of the application, handling:

- Event listing and filtering
- Category-based event browsing
- Event details and registration
- Featured events showcase
- Waitlist management

### Auth

The Auth module handles user authentication and authorization:

- User registration
- Login/logout
- Profile management
- Permission-based access control

### Organizers

The Organizers module supports event creators:

- Organization profile management
- Event creation and editing
- Attendee management
- Analytics and reporting

## Codebase Map

```
connect_more_reactjs/
├── src/                   # Application source code
│   ├── features/          # Feature modules
│   │   ├── events/        # Events feature
│   │   │   ├── application/     # State management with Zustand
│   │   │   ├── data/           # API repositories
│   │   │   ├── domain/         # Data models
│   │   │   ├── presentation/   # UI components
│   │   ├── auth/          # Authentication feature
│   │   ├── organizers/    # Organizer management feature
│   ├── components/        # Shared UI components
│   │   ├── carousel/      # Carousel components
│   │   ├── common/        # Common UI elements
│   │   ├── layout/        # Layout components (Header, Footer)
│   ├── services/          # Core services
│   │   ├── api.ts         # API client configuration
│   │   ├── testApi.ts     # Mock API for development
│   ├── context/           # React context providers
│   ├── config/            # Application configuration
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # Application entry point
├── public/                # Static assets
├── docs/                  # Documentation
│   ├── api.md             # API documentation
│   ├── database_structure.md  # Database structure documentation
│   ├── database_diagram.md    # Database ER diagram
│   ├── README.md          # Project documentation
├── package.json           # Project dependencies and scripts
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # TailwindCSS configuration
├── tsconfig.json          # TypeScript configuration
```

### Key Component Breakdown

#### Features/Events

- **domain/** - Contains Event models and type definitions
- **data/** - Contains the eventRepository for API communication
- **application/** - Houses the eventsStore (Zustand) for state management
- **presentation/** - Contains UI components specific to the events feature

#### Components

- **layout/** - Contains Header, Footer, and other layout components
- **carousel/** - Contains HeroCarousel and EventCarousel for displaying event collections
- **common/** - Contains reusable UI elements like buttons, cards, and form inputs

#### Services

- **api.ts** - Configures Axios for API communication
- **testApi.ts** - Provides mock data for development

## API Documentation

Detailed API documentation is available in the [API Documentation](./api.md) file. The application communicates with a REST API hosted on AWS using Lambda functions and API Gateway.

Key endpoints include:

- `GET /events` - Get events with filtering options
- `GET /events/:id` - Get specific event details
- `POST /events/:id/register` - Register for an event
- `GET /events/:id/waitlist` - Get waitlist status

## Database Structure

The database is structured around core entities:

- Events
- Event Instances
- Users
- Organizers
- Categories
- Tags

For a detailed overview of the database structure, see the [Database Structure Documentation](./database_structure.md) and [Database ER Diagram](./database_diagram.md).

---

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 