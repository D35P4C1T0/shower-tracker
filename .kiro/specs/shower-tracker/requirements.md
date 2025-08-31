# Requirements Document

## Introduction

A Progressive Web App (PWA) for tracking personal shower habits with local data storage, calendar visualization, and configurable notifications. The application will provide a simple interface to record showers, view historical data on a calendar, track time since last shower, and send reminders when too much time has passed. The app will be built with modern web technologies, feature a clean design with theme switching, and be deployable to GitHub Pages or Vercel.

## Requirements

### Requirement 1

**User Story:** As a user, I want to record when I take a shower so that I can track my hygiene habits.

#### Acceptance Criteria

1. WHEN the user visits the homepage THEN the system SHALL display a prominent "Record it" button
2. WHEN the user clicks the "Record it" button THEN the system SHALL record the current date and time as a shower entry
3. WHEN a shower is recorded THEN the system SHALL store the data locally in the browser
4. WHEN a shower is recorded THEN the system SHALL provide visual feedback confirming the action

### Requirement 2

**User Story:** As a user, I want to see a calendar view of my shower history so that I can visualize my patterns over time.

#### Acceptance Criteria

1. WHEN the user navigates to the calendar view THEN the system SHALL display a monthly calendar interface
2. WHEN the calendar loads THEN the system SHALL mark days that have recorded showers with visual indicators
3. WHEN the user clicks on a marked day THEN the system SHALL show details about the shower(s) recorded on that day
4. WHEN the user navigates between months THEN the system SHALL maintain the shower markings for all historical data

### Requirement 3

**User Story:** As a user, I want to see how long it's been since my last shower so that I can stay aware of my hygiene schedule.

#### Acceptance Criteria

1. WHEN the user views the homepage THEN the system SHALL display the time elapsed since the last recorded shower
2. WHEN displaying elapsed time THEN the system SHALL show appropriate units (seconds, minutes, hours, days, weeks)
3. WHEN no showers have been recorded THEN the system SHALL display an appropriate message
4. WHEN the elapsed time updates THEN the system SHALL refresh the display automatically

### Requirement 4

**User Story:** As a user, I want to receive notifications when too much time has passed since my last shower so that I don't forget my hygiene routine.

#### Acceptance Criteria

1. WHEN the configured number of days has passed since the last shower THEN the system SHALL send a notification to the user
2. WHEN the user opens settings THEN the system SHALL allow configuration of the notification threshold in days
3. WHEN the user toggles notifications off THEN the system SHALL not send any reminder notifications
4. WHEN notifications are enabled THEN the system SHALL request appropriate browser permissions

### Requirement 5

**User Story:** As a user, I want to customize app settings so that the interface matches my preferences and locale.

#### Acceptance Criteria

1. WHEN the user opens settings THEN the system SHALL provide options to configure the first day of the week
2. WHEN the user opens settings THEN the system SHALL provide a toggle to enable/disable notifications
3. WHEN the user opens settings THEN the system SHALL display GitHub repository and author information
4. WHEN the user opens settings THEN the system SHALL provide a theme switcher with dark, light, and system options
5. WHEN settings are changed THEN the system SHALL persist the changes locally
6. WHEN the theme is changed THEN the system SHALL apply the new theme immediately

### Requirement 6

**User Story:** As a mobile user, I want to install the app on my device so that I can access it like a native application.

#### Acceptance Criteria

1. WHEN a mobile user visits the app THEN the system SHALL detect if the app can be installed as a PWA
2. WHEN the app is installable on Android THEN the system SHALL show appropriate installation instructions
3. WHEN the app is installable on iPhone THEN the system SHALL show iOS-specific installation instructions
4. WHEN the user has already installed the app THEN the system SHALL not show installation prompts
5. WHEN the app is accessed THEN the system SHALL function offline for core features

### Requirement 7

**User Story:** As a developer, I want the app to be built with modern technologies and be easily deployable so that it's maintainable and accessible.

#### Acceptance Criteria

1. WHEN the app is built THEN the system SHALL use modern web technologies and frameworks
2. WHEN the app is styled THEN the system SHALL use a modern CSS framework like shadcn/ui
3. WHEN the app is deployed THEN the system SHALL be compatible with GitHub Pages or Vercel hosting
4. WHEN the codebase is reviewed THEN the system SHALL maintain a small and tidy structure
5. WHEN the app loads THEN the system SHALL meet PWA requirements including service worker and manifest
6. WHEN data is stored THEN the system SHALL use browser local storage or IndexedDB for persistence