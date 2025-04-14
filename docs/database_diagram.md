# Database Entity Relationship Diagram

Below is a diagram showing the core entities and their relationships in the Connect More Backend database.

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    USERS ||--o{ EVENT_ATTENDEES : registers_for
    USERS ||--o{ EVENT_WAITLIST : waits_for
    USERS ||--o{ EVENTS : creates
    
    ROLES ||--o{ USER_ROLES : assigned_to
    ROLES ||--o{ ROLE_PERMISSIONS : has
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : granted_to
    
    EVENTS ||--|{ EVENT_INSTANCES : generates
    EVENTS ||--o{ ATTACHMENTS : has
    EVENTS ||--o{ EVENTS_TAGS : has
    EVENTS ||--o{ EVENTS_FLAGS : has
    EVENTS }o--|| EVENT_CATEGORIES : belongs_to
    EVENTS }o--o| EVENT_SUBCATEGORIES : belongs_to
    EVENTS }o--|| ORGANIZERS : organized_by
    EVENTS }o--o| EVENT_VENUES : located_at
    EVENTS }o--|| EVENT_STATUSES : has
    
    EVENT_INSTANCES }o--o| EVENT_VENUES : located_at
    EVENT_INSTANCES ||--o{ EVENT_ATTENDEES : has
    EVENT_INSTANCES ||--o{ EVENT_WAITLIST : has
    EVENT_INSTANCES }o--|| EVENT_INSTANCE_STATUSES : has
    
    EVENT_CATEGORIES ||--|{ EVENT_SUBCATEGORIES : has
    TAGS ||--o{ EVENTS_TAGS : applied_to
    FLAGS ||--o{ EVENTS_FLAGS : applied_to
    
    ORGANIZERS ||--o{ ORGANIZER_SOCIAL_MEDIA : has
    
    USERS {
        int id PK
        string email
        string display_name
        string first_name
        string last_name
        string phone
        timestamp created_at
        timestamp updated_at
        timestamp last_login
        boolean is_active
    }
    
    EVENTS {
        int id PK
        string event_id UK
        string name
        text description
        date start_date
        date end_date
        string recurrence
        int organizer_id FK
        int venue_id FK
        int creator_id FK
        int category_id FK
        int subcategory_id FK
        int status_id FK
        boolean is_recurring
        int max_attendees
        timestamp start_datetime
        timestamp end_datetime
    }
    
    EVENT_INSTANCES {
        int id PK
        int event_id FK
        date instance_date
        time start_time
        time end_time
        string instance_name
        int instance_venue_id FK
        int status_id FK
        timestamp start_datetime
        timestamp end_datetime
        int current_attendees
        int max_attendees
        boolean allow_waitlist
    }
    
    EVENT_ATTENDEES {
        int id PK
        int instance_id FK
        int user_id FK
        string response_status
        text comment
        int additional_guests
    }
    
    EVENT_WAITLIST {
        int id PK
        int event_instance_id FK
        int user_id FK
        int waitlist_position
        timestamp created_at
    }
    
    ORGANIZERS {
        int id PK
        string name
        string contact_phone
        string website_url
        timestamp created_at
        timestamp updated_at
    }
    
    EVENT_VENUES {
        int id PK
        string name
        string address
        string city
        string state
        string postal_code
        geography location
    }
    
    EVENT_CATEGORIES {
        int id PK
        string category_name
    }
    
    EVENT_SUBCATEGORIES {
        int id PK
        int category_id FK
        string subcategory_name
    }
    
    TAGS {
        int id PK
        string tag_name
    }
    
    ROLES {
        int id PK
        string role_name
    }
    
    PERMISSIONS {
        int id PK
        string permission_name
        text description
    }
```

## How to Read This Diagram

This entity-relationship diagram (ERD) shows:

1. **Entities**: Represented by rectangles with their name at the top and attributes listed below
2. **Relationships**: Shown as lines connecting entities with cardinality indicators:
   - `||--||`: One-to-one relationship
   - `||--|{`: One-to-many relationship
   - `}|--|{`: Many-to-many relationship
   - `}o--o|`: Zero-or-one to zero-or-one relationship
   - `}o--|{`: Zero-or-one to many relationship

3. **Key fields**:
   - PK: Primary Key
   - FK: Foreign Key
   - UK: Unique Key

The diagram focuses on the most important entities and relationships in the system, particularly those relevant to event registration and the waitlist functionality. 