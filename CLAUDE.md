# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CPS Dragonfly Web Dashboard - A React-based web application for managing industrial drone operations and inventory tracking. The system provides real-time drone control (manual and autopilot modes), flight analytics, and inventory management with location tracking.

**Related Repositories:**
- Mobile Scanner App: https://github.com/aidilaqif/cps_dragonfly_mobile_app
- CPS API Backend: https://github.com/dzker/cps-api

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on localhost:3000)
npm start

# Build for production
npm build

# Run tests
npm test

# Run specific test file
npm test -- <filename>
```

## Environment Configuration

This app requires two separate API endpoints configured in `.env`:

```
REACT_APP_API_URL="<drone_api_url>"          # Real-time drone control API (Flask-based)
REACT_APP_API_BASE_URL="<cps_api_url>"       # Data management API (items, locations, analytics)
```

See `.env-example` for template.

## Architecture

### Dual-API System

The application communicates with two separate backends:

1. **Drone API** (`REACT_APP_API_URL`) - Real-time drone operations
   - Drone connection/status
   - Movement commands (up, down, left, right, forward, back, rotate)
   - QR code scanning
   - Battery monitoring
   - Flight session control
   - Video streaming

2. **Web API** (`REACT_APP_API_BASE_URL`) - Data management
   - Items CRUD operations
   - Locations management
   - Analytics (battery efficiency, movement patterns, performance)
   - Data export (CSV, Excel)

**Important:** Some service files have hardcoded `localhost:8080` URLs (e.g., `item.service.js:25, 86`). These should use the centralized `endpoints` config from `src/config/api.config.js`.

### Application Structure

```
src/
├── components/
│   ├── dashboard/          # Analytics dashboard with Recharts
│   ├── drone/
│   │   ├── autopilot/      # Automated flight sessions
│   │   ├── manualpilot/    # Manual drone control
│   │   └── shared_components/  # Shared between both modes (ScannedItemTable, CreateItemDialog)
│   ├── exports/            # Data export with Excel/CSV/PDF
│   ├── items/              # Inventory item management
│   ├── locations/          # Warehouse location management
│   └── navigation/         # Main navigation sidebar
├── services/               # API service layer (fetch-based)
├── config/
│   └── api.config.js       # Centralized API endpoint definitions
└── assets/styles/          # Component-specific CSS files
```

### Navigation System

The app uses a simple state-based navigation in `App.js` rather than React Router for the main views. The `NavigationTab` component controls which page is displayed via `currentPage` state:

- `renderPage` (default) → Dashboard
- `drone` → Manual Pilot
- `autopilot` → AutoPilot
- `items` → Item Management
- `locations` → Location Management
- `exports` → Export/Analytics

### Service Layer Pattern

All API calls go through service files in `src/services/`:
- Each service exports an object with async methods
- Uses native `fetch` API (no axios)
- Endpoints are centralized in `src/config/api.config.js`
- Error handling: Services throw errors; components handle them

Example pattern:
```javascript
// service
export const itemService = {
  async getAllItems(filters = {}) {
    const response = await fetch(`${endpoints.items.getAll}?${queryParams}`);
    if (!response.ok) throw new Error("Failed to fetch items");
    return response.json();
  }
};

// component usage
try {
  const data = await itemService.getAllItems({ status: 'active' });
} catch (error) {
  // handle error in component
}
```

## Key Component Concepts

### Drone Control Modes

**Manual Pilot** (`DroneInterface.jsx`):
- Direct control with customizable distances (multiples of 5cm, max 100cm)
- Rotation in 90-degree increments (max 360°)
- Real-time battery and connection status
- QR scanning for inventory items

**AutoPilot** (`AutoPilot.jsx`):
- Flight session management with predefined patterns
- Star/favorite patterns for quick access
- Automated command sequences
- Flight logs with movement history
- Battery dashboard

Both modes share:
- `ScannedItemTable` for displaying scanned QR codes
- `CreateItemDialog` for creating new inventory items
- Connection polling (status updates every 2 seconds)

### Dashboard & Analytics

Uses Recharts for visualization:
- Battery efficiency trends
- Movement pattern analysis
- Flight performance metrics
- Location utilization
- Item distribution charts

Data fetched from `/api/analysis/*` endpoints.

### Styling Approach

- **Tailwind CSS** for utility-first styling
- **Ant Design** components (Card, Table, Modal, etc.)
- **Custom CSS** in `assets/styles/` for component-specific overrides
- **shadcn/ui** components for modern UI elements

## Common Patterns

**State Polling:**
Many components use intervals to poll drone status:
```javascript
useEffect(() => {
  const interval = setInterval(fetchStatus, 2000);
  return () => clearInterval(interval);
}, [dependencies]);
```

**QR Scanned Items:**
Items scanned by drone are stored with timestamps and can be:
- Viewed in the scanned items table
- Created as new items if they don't exist
- Updated with location information

**Export Functionality:**
- Preview before export
- Filter by date range, status, location, type
- Multiple formats: Excel (XLSX), CSV, PDF
- Uses `xlsx` library for spreadsheet generation

## Testing

Tests use React Testing Library and Jest (configured via `react-scripts`). Test files follow the `*.test.js` naming convention.

## Important Notes

- The app was created with Create React App (CRA) and uses `react-scripts`
- Environment variables MUST use the `REACT_APP_` prefix
- The navigation sidebar can collapse, affecting main content layout via CSS class
- Drone connection status is polled continuously when on drone-related pages
- Movement validation is strict: distances must be multiples of 5 (max 100), rotations multiples of 90 (max 360)
