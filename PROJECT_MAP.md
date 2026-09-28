# Project Map & Architecture

This document serves as the definitive source of truth for the project structure, component responsibilities, and architectural patterns of the **BodyLine/MemberHub** platform.

---

## 🏛️ Multi-Community & Isolation Architecture (ריבוי קהילות ומידור)

The application implements a secure, high-fidelity **Multi-Tenant (Multi-Community)** architecture. Each community operates as an isolated, independent cell while sharing a single unified React application and Firestore backend.

### 1. Data Scoping & Schema (`src/types.ts` & `src/constants.ts`)
* **Communities Field**: Members hold a `communities: string[]` field indicating the branches they are enrolled in.
* **Available Communities**: Defined dynamically in `AVAILABLE_COMMUNITIES` inside `src/constants.ts` (e.g. `herzliya`, `herzliya_adults` (הרצליה - בוגרים), `tel_baruch`, etc.).
* **On-Load Backward Compatibility**: Handled dynamically in `DataContext.tsx`. Legacy members without a `communities` field are automatically assigned to `['herzliya']` (or all communities for `Staff`/`Support` roles) in-memory on snapshot load.

### 2. Community Session Isolation (`src/contexts/DataContext.tsx`)
* **Dynamic Active Sessions**: Active sessions are split and isolated at the document level in Firestore:
  - Document path: `site_data/active_session_{communityId}` (e.g., `active_session_herzliya_adults`).
  - Attendance check-ins (`toggleSessionAttendance`) and rollovers (`finalizeSession`) are fully scoped to the active community, ensuring attendance data does not leak between branches.
* **Segmented History**: Finalized sessions are saved in the `weekly_history` collection with a unique community-scoped ID: `${communityId}_${date}` and hold a `communityId` property.

### 3. Front-End UI Isolation
* **Home Page (`src/pages/HomePage.tsx`)**: Raw member data fetched from Firestore is filtered locally based on `currentCommunityId` before any stats or metrics are calculated, ensuring community-specific averages, Grit Score percentiles, active pairs, and attendance lists are completely private.
* **Community Directory (`src/pages/DirectoryPage.tsx`)**: The directory lists only members who are associated with the currently active logged-in community.

---

## 🛡️ Strict Role-Based Access Control (מערך הרשאות הדוק)

The app enforces absolute **Role-Based Access Control (RBAC)** based strictly on the user's Firestore `role` property:

1. **Staff / Support (`Staff` / `Support`)**: Automatically enrolled in all 20 communities. Can perform system administration tasks.
2. **Coordinators (`Admin`)**: Can manage and view member directories, edit memberships, and manage sessions/events. Restricted strictly to the communities they are members of.
3. **Instructors (`Instructor`)**: Can edit, log, and view sessions/events.
4. **Volunteers / Members (`Volunteer` / `Member`)**: Standard access. Completely restricted from admin/coordination settings, sessions tracking, and engine room.
   - **Profile Constraints**: Cannot edit their community associations; community fields are rendered as **Read-Only** on the profile page (`ProfilePage.tsx`).

*Security Integrity*: Functions like `isAdminUser` and `isPrivilegedGalleryManager` are bounded strictly by the database `role` value with **zero hardcoded email bypasses or backdoors**, allowing authentic previewing and testing under different roles.

---

## ## Directory Structure

- `/src`: All source code resides here.
  - `/components`: Reusable UI components.
    - `/admin`: Components specific to the admin dashboard.
  - `/contexts`: React Contexts for state management (e.g. `AuthContext`, `DataContext`, `ModalContext`).
  - `/pages`: Top-level page components (e.g., `HomePage`, `DirectoryPage`, `ProfilePage`, `LoginPage`).
  - `/services`: Logic for interacting with external APIs (e.g., Firebase Auth/Firestore).
  - `/utils`: Utility functions and helper modules (e.g., `bodyLineStats`, `crypto`).
  - `App.tsx`: Main application router with route-level security guards.
  - `constants.ts`: System constants and dynamic permission evaluators.

## Key Files

- `index.html`: Main HTML entry point.
- `package.json`: Project dependencies and scripts.
- `firestore.rules`: Firestore security rules enforcing role and community validation.

## AI Guidelines

- **Source Code Location**: All source code MUST reside within the `src/` directory.
- **Import Paths**: Use relative paths within `src/` (e.g., `../utils/surfMath`). NEVER use `../src/` in imports within the `src/` directory.
- **Preservation**: Critical components or logic sections may be marked with `@ai-preserve` to signal they should not be refactored without explicit request.
