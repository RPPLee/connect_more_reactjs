# Connect More Backend - Database Structure

## Overview

This document explains the structure and relationships of the Connect More event management system database. The system is designed to handle events, organizers, venues, and user registrations with features including recurring events, waitlists, and role-based access control.

## Core Entities

### Users
Users are individuals who can create events, register for events, and manage organizations.
- Primary fields: `id`, `email`, `display_name`, `first_name`, `last_name`, `phone`
- A user can have one or more roles (admin, organizer, user)
- Users can register for events and join waitlists

### Events
Events represent activities organized by organizers at specific venues.
- Primary fields: `id`, `event_id` (UUID), `name`, `description`, `start_date`, `end_date`, `start_datetime`, `end_datetime`
- Events can be one-time or recurring
- Events can have categories, subcategories, and tags
- Events can have a maximum number of attendees (`max_attendees`)
- Events are associated with an organizer and optionally a venue

### Event Instances
Event instances represent specific occurrences of an event, particularly important for recurring events.
- Primary fields: `id`, `event_id`, `instance_date`, `start_datetime`, `end_datetime`
- Each instance can have its own details that override the parent event (venue, name, etc.)
- Instances track registration counts (`current_attendees`) and capacity (`max_attendees`)
- Instances can allow waitlisting (`allow_waitlist`)

### Organizers
Organizers are entities that host events.
- Primary fields: `id`, `name`, `contact_phone`, `website_url`
- Organizers can have addresses and social media profiles
- Users can be associated with organizers through roles

### Venues
Venues are physical locations where events take place.
- Primary fields: `id`, `name`, `address`, `city`, `state`, `postal_code`
- Events and event instances reference venues

## Event Registration System

### Registration Process
1. Users register for specific event instances
2. The system checks if the event instance has reached its capacity:
   - If space is available, the user is registered
   - If at capacity and waitlisting is allowed, the user is added to the waitlist
   - If at capacity and waitlisting is not allowed, registration is rejected

### Waitlist Functionality
- Waitlisted users are assigned a sequential position
- When a registered user cancels, the first person on the waitlist is automatically moved to registered status
- Waitlist positions are updated when users leave the waitlist

## Recurring Events

### Recurrence Format
Recurrence rules are stored in the `recurrence` field of the `events` table using the iCalendar (RFC 5545) format. Examples:

- `FREQ=WEEKLY;INTERVAL=1;COUNT=6` - Weekly event that repeats 6 times
- `FREQ=MONTHLY;BYDAY=TU;INTERVAL=1;COUNT=10` - Monthly event on Tuesdays that repeats 10 times

### Recurrence Components
- `FREQ`: Frequency (DAILY, WEEKLY, MONTHLY, YEARLY)
- `INTERVAL`: How often the recurrence repeats (1 = every occurrence, 2 = every other, etc.)
- `COUNT`: Number of occurrences
- `UNTIL`: End date for recurrences
- `BYDAY`: Specific days of the week (MO, TU, WE, TH, FR, SA, SU)
- `BYMONTHDAY`: Specific days of the month (1-31)

### Event Instance Generation
When a recurring event is created:
1. The system reads the recurrence rule
2. Generates individual event instances based on the rule
3. Each instance inherits properties from the parent event
4. Instances can be modified individually without affecting other instances

## Access Control

### Roles and Permissions
The system implements role-based access control:
- `admin`: Full system access
- `organizer`: Can create and manage their own events
- `user`: Can register for events

### Authorization Flow
1. Users authenticate and receive a token
2. The token contains user ID and roles
3. API endpoints verify permissions before allowing operations

## Database Tables

### Core Tables
- `users`: User accounts
- `events`: Event definitions
- `event_instances`: Individual occurrences of events
- `organizers`: Event organizers/hosts
- `event_venues`: Event locations

### Registration Tables
- `event_attendees`: Registered participants for events
- `event_waitlist`: Users waiting for space in full events

### Taxonomy Tables
- `event_categories`: Main event categories
- `event_subcategories`: Subcategories within main categories
- `tags`: Tags that can be associated with events
- `events_tags`: Junction table connecting events to tags

### Access Control Tables
- `roles`: Available system roles
- `user_roles`: Junction table connecting users to roles
- `permissions`: Available system permissions
- `role_permissions`: Junction table connecting roles to permissions

### Status Tables
- `event_statuses`: Possible event statuses
- `event_instance_statuses`: Possible event instance statuses

### Other Tables
- `audit_log`: System audit trail
- `attachments`: Files attached to events
- `flags`: System flags
- `events_flags`: Junction table connecting events to flags
- `organizer_social_media`: Social media profiles for organizers

## Materialized Views

### events_view
The system uses a materialized view called `events_view` that denormalizes event data for efficient querying:

- Combines data from events, event_instances, organizers, venues, categories, etc.
- Includes attendee information, tags, and flags
- Contains event and instance details in a flattened structure
- Includes counts of registrations and waitlist entries for each instance
- Provides geographic data for venues
- Has specialized indexes for efficient querying by location, date, and full-text search

This view is the primary data source for the event listing APIs, providing optimized performance for complex queries without requiring complex joins at query time. The view is refreshed automatically when underlying data changes via database triggers.

## Key Relationships

- Events have many Event Instances
- Event Instances have many Attendees
- Event Instances have many Waitlist entries
- Events belong to Organizers
- Events and Event Instances can be at Venues
- Users can have multiple Roles
- Roles have multiple Permissions
- Events can have multiple Tags
- Events belong to Categories and Subcategories

## Database Indexes

Strategic indexes are created on:
- Search vectors for text searching
- Foreign keys for relationship lookups
- Date fields for date-range queries
- Status fields for filtering by status
- Geographic location for proximity searches

## Additional Notes

- The system uses Postgres-specific features like JSONB for storing structured data
- Triggers automate timestamp updates, audit logging, and materialized view refreshes
- Event instances are created automatically for recurring events
- The system enforces referential integrity through foreign key constraints 