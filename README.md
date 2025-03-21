# Stock/Asset Market Simulation Platform

A comprehensive financial education platform that includes stock trading simulations, market simulations, and financial literacy learning materials. This application is designed to help users learn about investing and financial markets in a risk-free environment.

## Features

### Stock Trading Platform
- **Portfolio Creation and Management**: Create, view, and manage investment portfolios
- **Mobile-Responsive UI**: Dedicated views for mobile and desktop interfaces
- **Real-Time Stock Data**: Integration with financial APIs for real market data
- **Investment Tracking**: Monitor portfolio performance over time
- **Admin Controls**: User management and portfolio oversight capabilities

### Group Market Simulation
- **Group Creation**: Create groups for simulation exercises
- **Asset Allocation**: Distribute investments across different asset classes (equity, bonds, real estate, commodities)
- **Simulation Controls**: Run quarter-by-quarter or full simulations
- **Visual Analytics**: Track portfolio performance through interactive charts
- **Results Analysis**: Review simulation outcomes and investment strategies

### Financial Literacy Learning Platform
- **Basic Financial Literacy**: Educational content on fundamental financial concepts
- **Investment Course**: Dedicated learning materials on investing principles
- **Stock Market Today**: Current market news and updates

## Technical Stack

- **Frontend**: Vue.js 3, Chart.js for data visualization
- **Backend**: Firebase (Authentication, Firestore, Analytics)
- **API Integration**: Financial data APIs for real-time market information
- **Authentication**: Firebase Authentication with role-based access control
- **Responsive Design**: Support for both desktop and mobile interfaces

## Project Setup

```
# Install dependencies
npm install

# Compiles and hot-reloads for development
npm run serve

# Compiles and minifies for production
npm run build

# Lints and fixes files
npm run lint
```

## User Roles

- **Admin/Developer**: Full access to all platform features including user management, code management, and simulation controls
- **Standard User**: Access to portfolio creation, viewing, and learning materials

## Security

- Role-based access control for protected routes
- Secure Firebase authentication
- Data privacy protections for user information

## Data Management

- User portfolios stored in Firebase Firestore
- Real-time data synchronization
- Historical portfolio tracking

## Mobile Support

The application includes dedicated mobile views for core features, automatically detecting device type and routing to the appropriate interface.

## Customization

See [Vue CLI Configuration Reference](https://cli.vuejs.org/config/) for customization options.
