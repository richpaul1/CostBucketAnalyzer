# CostAnalyzer - Professional Cost Management Application

## Overview

CostAnalyzer is a modern web application built with SvelteKit for comprehensive cost analysis and financial management. The application provides a professional interface for uploading, analyzing, and visualizing business cost data with features including expense tracking, budget planning, and detailed analytics.

## System Architecture

### Frontend Architecture
- **Framework**: SvelteKit 2.22.0 with Svelte 5.34.7
- **Build Tool**: Vite 6.3.5 for fast development and optimized production builds
- **Styling**: Custom CSS with CSS variables for theming support
- **Icons**: Lucide Svelte for consistent iconography
- **State Management**: Svelte stores for theme management and application state

### Backend Architecture
- **Adapter**: SvelteKit Node.js adapter for server-side rendering and deployment
- **Server**: Express.js integration for potential API endpoints
- **Development Server**: Custom Vite development server with Replit-specific configuration

### Component Architecture
- **Layout System**: Root layout with header, sidebar, and main content areas
- **Reusable Components**: Modular components for cost cards, charts, file uploads, and data visualization
- **Page-based Routing**: SvelteKit's file-based routing system

## Key Components

### Core Pages
1. **Dashboard** (`/`): Main overview with cost metrics and summary cards
2. **Upload Data** (`/upload`): File upload interface for CSV, Excel, and JSON cost data
3. **Analytics** (`/analytics`): Detailed cost analysis with charts and trends
4. **Expenses** (`/expenses`): Expense management with filtering and categorization
5. **Budget Planning** (`/budget`): Budget setting and tracking functionality

### Reusable Components
- **CostCard**: Metric display cards with loading and error states
- **CostChart**: Data visualization component with SVG-based charts
- **ExpenseBreakdown**: Category-based expense analysis
- **FileUpload**: Drag-and-drop file upload with validation
- **Header**: Application header with branding and theme toggle
- **Sidebar**: Navigation sidebar with route highlighting
- **ThemeToggle**: Light/dark theme switching

### Stores and State Management
- **Theme Store**: Manages application theme with localStorage persistence and system preference detection

## Data Flow

### File Upload Process
1. User selects or drags files to upload interface
2. Client-side validation for file types (.csv, .xlsx, .json) and size limits
3. Files processed through FileUpload component
4. Upload status tracked with loading/error states
5. Data intended for backend processing (not currently implemented)

### Theme Management
1. Theme preference stored in localStorage
2. System theme preference detection as fallback
3. CSS custom properties updated dynamically
4. Theme state managed through Svelte store

### Navigation
1. File-based routing through SvelteKit
2. Active route highlighting in sidebar
3. Responsive design with mobile considerations

## External Dependencies

### Core Dependencies
- **@sveltejs/kit**: Meta-framework for Svelte applications
- **@sveltejs/adapter-node**: Node.js deployment adapter
- **@sveltejs/vite-plugin-svelte**: Vite integration for Svelte
- **svelte**: Component framework
- **vite**: Build tool and development server
- **lucide-svelte**: Icon library
- **express**: Web framework (for potential API endpoints)

### Development Configuration
- **Replit Integration**: Custom configuration for Replit hosting environment
- **Host Configuration**: Configured for 0.0.0.0 binding with allowedHosts for Replit domains
- **HMR Configuration**: Hot module replacement on separate port for development

## Deployment Strategy

### Replit Deployment
- **Platform**: Designed for Replit hosting environment
- **Configuration**: Custom .replit file with Node.js 20 module
- **Workflows**: Automated dependency installation and project startup
- **Port Configuration**: Development server on port 5000 with HMR on 5001

### Production Build
- **Adapter**: Node.js adapter for server-side rendering
- **Output**: Build directory with precompressed assets disabled
- **Environment**: Configurable environment prefix support

### Development Workflow
- **Dev Server**: Custom development server (dev-server.mjs) with Replit-specific settings
- **Build Process**: Standard SvelteKit build pipeline
- **Asset Handling**: Static asset serving through SvelteKit

## Changelog

Changelog:
- June 21, 2025. Complete CostAnalyzer application built with SvelteKit
  - Created professional dashboard with cost overview cards
  - Implemented file upload system for CSV, Excel, and JSON files
  - Built analytics page with charts and detailed insights
  - Added expense management with filtering and categorization
  - Created budget planning with category management
  - Implemented dark/light theme toggle functionality
  - Responsive design with sidebar navigation
  - All pages include proper empty states with user guidance
- June 20, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.