# Project Map

This document serves as the definitive source of truth for the project structure and component responsibilities.

## Directory Structure

- `/src`: All source code resides here.
  - `/components`: Reusable UI components.
    - `/admin`: Components specific to the admin dashboard.
  - `/pages`: Top-level page components.
  - `/contexts`: React Contexts for state management.
  - `/services`: Logic for interacting with external APIs (e.g., Firebase).
  - `/utils`: Utility functions and helper modules.
  - `/data`: Static data files (e.g., JSON configurations).
  - `App.tsx`: Main application component with routing.
  - `index.tsx`: Application entry point.
  - `types.ts`: Global TypeScript type definitions.
  - `constants.ts`: Global constants.
  - `index.css`: Global Tailwind CSS styles.

## Key Files

- `index.html`: Main HTML entry point.
- `package.json`: Project dependencies and scripts.
- `tsconfig.json`: TypeScript configuration.
- `vite.config.ts`: Vite build configuration.
- `firebase.ts`: Firebase initialization and configuration.
- `firestore.rules`: Firestore security rules.

## AI Guidelines

- **Source Code Location**: All source code MUST reside within the `src/` directory.
- **Import Paths**: Use relative paths within `src/` (e.g., `../utils/surfMath`). NEVER use `../src/` in imports within the `src/` directory.
- **Preservation**: Critical components or logic sections may be marked with `@ai-preserve` to signal they should not be refactored without explicit request.
