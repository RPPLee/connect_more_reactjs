# Connect More Backend

Connect More is an event management platform backend built on AWS Lambda and API Gateway. This repository contains the backend code for managing events, organizers, venues, and authentication.

## Architecture

The system is built with the following components:

- **AWS Lambda Functions**: Organized in modular folders (`events`, `organizers`, `venues`) for handling different API endpoints
- **API Gateway**: For HTTP API management and routing
- **Lambda Authorizer**: Using Firebase for authentication
- **PostgreSQL Database**: For data storage
- **Lambda Layers**: For shared dependencies (common utilities, Firebase auth, etc.)

## Prerequisites

- AWS CLI installed and configured
- Python 3.9+
- Firebase project for authentication

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
AWS_REGION=us-east-2
AWS_PROFILE=default
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
LAMBDA_EXECUTION_ROLE=arn:aws:iam::your-account-id:role/connect-more-lambda-role
API_GATEWAY_ID=your-api-gateway-id
```

### Firebase Configuration

Ensure you have a Firebase service account JSON file at:
```
/Users/leemartin/development/connect_more_backend/connect-more-flutter-firebase-adminsdk-fbsvc-7c78d582eb.json
```

## Deployment

### Setup IAM Permissions

```bash
python setup_iam_role.py
python setup_iam_permissions.py
```

### Create/Update Lambda Layers

```bash
python update_lightweight_layer.py
```

This creates/updates:
- A lightweight layer with Firebase authentication and common utilities
- An authorizer Lambda function configured with Firebase authentication

### Deploy Lambda Functions

To deploy all functions:

```bash
python deploy_all.py
```

To deploy a single function:

```bash
python deploy_single.py events/get_events.py
```

### Setup API Gateway

```bash
python setup_api_gateway.py
```

## API Base URL

The API is deployed and available at:
```
https://cqyyqvabi8.execute-api.us-east-2.amazonaws.com/prod
```

Use this as the base URL for all API endpoints documented below.

## Authentication

### Firebase Authentication

This API uses Firebase Authentication. To access protected endpoints, you need to:

1. Create a Firebase account for your users through the Firebase console or your app
2. When a user logs in, retrieve their Firebase ID token from the client-side
3. Include this token in the `Authorization` header of all API requests:

```
Authorization: Bearer <firebase-id-token>
```

#### Firebase ID Token Details

- **Token Format**: JWT (JSON Web Token)
- **Expiration**: Firebase ID tokens are valid for 1 hour
- **Token Refresh**: Your client app should refresh tokens as needed
- **Required Claims**: The token must include the Firebase user ID

#### Sample Authentication Flow

1. User logs in through your client app using Firebase Authentication
2. Your client app receives a Firebase ID token
3. Your client app includes this token in API requests
4. The API verifies the token and identifies the user

#### Example Authentication Code (JavaScript)

```javascript
// After Firebase user login
firebase.auth().currentUser.getIdToken(true).then(function(idToken) {
  // Send this token with your API requests
  fetch('https://cqyyqvabi8.execute-api.us-east-2.amazonaws.com/prod/events', {
    headers: {
      'Authorization': 'Bearer ' + idToken
    }
  })
  .then(response => response.json())
  .then(data => console.log(data));
}).catch(function(error) {
  console.error("Error getting ID token:", error);
});
```

## API Documentation

### Authentication

All API endpoints are protected by Firebase authentication. Include the following header with requests:

```
Authorization: Bearer {firebase-id-token}
```

### Events API

#### Get Events

- **Endpoint**: `GET /events`
- **Description**: Retrieve a list of events with optional filtering
- **Query Parameters**:
  - `search`: Search term for event title or description
  - `category_id`: Filter by category
  - `subcategory_id`: Filter by subcategory
  - `organizer_id`: Filter by organizer
  - `start_date`: Filter events starting on or after this date (YYYY-MM-DD)
  - `end_date`: Filter events ending on or before this date (YYYY-MM-DD)
  - `venue_id`: Filter by venue
  - `is_free`: If "true", only return free events
  - `tags`: Comma-separated list of tag IDs
  - `limit`: Number of results to return (default 50)
  - `offset`: Offset for pagination (default 0)
  - `upcoming`: If "true", only return future events
  - `past`: If "true", only return past events
  - `latitude` and `longitude`: For location-based search
  - `distance`: Maximum distance in kilometers from the specified location
  - `order_by`: Sort order (date_asc, date_desc, popularity, default=date_asc)
- **Response**: List of events with pagination information

#### Get Event

- **Endpoint**: `GET /events/{event_id}`
- **Description**: Retrieve details for a specific event
- **Path Parameters**:
  - `event_id`: ID of the event to retrieve
- **Response**: Detailed event information

#### Create Event

- **Endpoint**: `POST /events`
- **Description**: Create a new event
- **Request Body**:
  ```json
  {
    "title": "Event Title",
    "description": "Event Description",
    "organizer_id": 1,
    "category_id": 1,
    "subcategory_id": 1,
    "venue_id": 1,
    "image_url": "https://example.com/image.jpg",
    "thumbnail_url": "https://example.com/thumbnail.jpg",
    "recurrence": "FREQ=WEEKLY;UNTIL=20230630T000000Z",
    "instances": [
      {
        "date": "2023-06-01",
        "start_time": "18:00:00",
        "end_time": "20:00:00",
        "status": "active"
      }
    ],
    "tags": [1, 2, 3],
    "is_featured": false,
    "capacity": 100,
    "price": 0
  }
  ```
- **Response**: Created event details

#### Update Event

- **Endpoint**: `PUT /events/{event_id}`
- **Description**: Update an existing event
- **Path Parameters**:
  - `event_id`: ID of the event to update
- **Request Body**: Same as create event, only include fields to update
- **Response**: Updated event details

#### Delete Event

- **Endpoint**: `DELETE /events/{event_id}`
- **Description**: Delete an event
- **Path Parameters**:
  - `event_id`: ID of the event to delete
- **Response**: Success message

#### Register for Event

- **Endpoint**: `POST /events/{event_id}/instances/{instance_id}/register`
- **Description**: Register a user for an event instance
- **Path Parameters**:
  - `event_id`: ID of the event
  - `instance_id`: ID of the event instance
- **Request Body**:
  ```json
  {
    "attendee_name": "John Doe",
    "attendee_email": "john@example.com",
    "attendee_phone": "+1-555-123-4567",
    "num_tickets": 1
  }
  ```
- **Response**: Registration details

#### Cancel Registration

- **Endpoint**: `DELETE /events/{event_id}/instances/{instance_id}/register`
- **Description**: Cancel a user's registration for an event
- **Path Parameters**:
  - `event_id`: ID of the event
  - `instance_id`: ID of the event instance
- **Response**: Success message

#### Get Waitlist Status

- **Endpoint**: `GET /events/{event_id}/instances/{instance_id}/waitlist`
- **Description**: Check waitlist status for an event instance
- **Path Parameters**:
  - `event_id`: ID of the event
  - `instance_id`: ID of the event instance
- **Response**: Waitlist position and status

### Organizers API

#### Get Organizers

- **Endpoint**: `GET /organizers`
- **Description**: Retrieve a list of organizers
- **Query Parameters**:
  - `search`: Search term for organizer name
  - `limit`: Number of results to return (default 50)
  - `offset`: Offset for pagination (default 0)
- **Response**: List of organizers with pagination information

#### Get Organizer

- **Endpoint**: `GET /organizers/{organizer_id}`
- **Description**: Retrieve details for a specific organizer
- **Path Parameters**:
  - `organizer_id`: ID of the organizer to retrieve
- **Response**: Detailed organizer information

#### Create Organizer

- **Endpoint**: `POST /organizers`
- **Description**: Create a new organizer
- **Request Body**:
  ```json
  {
    "name": "Organizer Name",
    "email": "organizer@example.com",
    "phone": "+1-555-123-4567",
    "website": "https://example.com",
    "image_url": "https://example.com/logo.png",
    "address_line1": "123 Main St",
    "address_line2": "Suite 100",
    "city": "San Francisco",
    "state": "CA",
    "postal_code": "94105",
    "country": "USA",
    "events_url": "https://example.com/events",
    "auth_userid": "auth0|123456",
    "aliases": {
      "facebook": "https://facebook.com/organizer",
      "twitter": "https://twitter.com/organizer",
      "instagram": "https://instagram.com/organizer"
    }
  }
  ```
- **Response**: Created organizer details

#### Update Organizer

- **Endpoint**: `PUT /organizers/{organizer_id}`
- **Description**: Update an existing organizer
- **Path Parameters**:
  - `organizer_id`: ID of the organizer to update
- **Request Body**: Same as create organizer, only include fields to update
- **Response**: Updated organizer details

#### Delete Organizer

- **Endpoint**: `DELETE /organizers/{organizer_id}`
- **Description**: Delete an organizer
- **Path Parameters**:
  - `organizer_id`: ID of the organizer to delete
- **Response**: Success message

### Venues API

#### Get Venues

- **Endpoint**: `GET /venues`
- **Description**: Retrieve a list of venues
- **Query Parameters**:
  - `search`: Search term for venue name or address
  - `city`: Filter by city
  - `state`: Filter by state
  - `postal_code`: Filter by postal code
  - `limit`: Number of results to return (default 50)
  - `offset`: Offset for pagination (default 0)
  - `latitude` and `longitude`: For location-based search
  - `distance`: Maximum distance in kilometers from the specified location
- **Response**: List of venues with pagination information

#### Get Venue

- **Endpoint**: `GET /venues/{venue_id}`
- **Description**: Retrieve details for a specific venue
- **Path Parameters**:
  - `venue_id`: ID of the venue to retrieve
- **Response**: Detailed venue information

#### Create Venue

- **Endpoint**: `POST /venues`
- **Description**: Create a new venue
- **Request Body**:
  ```json
  {
    "name": "Venue Name",
    "address": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "postal_code": "12345",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "creator_organizer_id": 1,
    "aliases": {"alt_name": "The Venue", "shortened": "TV"}
  }
  ```
- **Response**: Created venue details

#### Update Venue

- **Endpoint**: `PUT /venues/{venue_id}`
- **Description**: Update an existing venue
- **Path Parameters**:
  - `venue_id`: ID of the venue to update
- **Request Body**: Same as create venue, only include fields to update
- **Response**: Updated venue details

#### Delete Venue

- **Endpoint**: `DELETE /venues/{venue_id}`
- **Description**: Delete a venue
- **Path Parameters**:
  - `venue_id`: ID of the venue to delete
- **Response**: Success message

## Troubleshooting

### Common Issues

1. **Authentication Errors**: 
   - Make sure your Firebase credentials are correctly set up and the token is valid
   - Ensure the token hasn't expired (they expire after 1 hour)
   - Check that you're sending the token in the correct format: `Authorization: Bearer <token>`
   - Verify that your Firebase project ID matches what the API expects

2. **Layer Updates Failing**: If you see `ResourceConflictException`, wait a few minutes and try again as Lambda operations can take time to complete

3. **Database Connection Issues**: 
   - Verify your database is running and accessible from AWS Lambda
   - Check if your Lambda functions' environment variables have the correct credentials
   - Ensure that your RDS security group allows inbound connections from Lambda

4. **Lambda Dependency Issues**: If you encounter issues with dependencies like `psycopg2` or `dotenv`, make sure you're using the latest layer versions:
   - Common layer version: 20
   - Psycopg2-SSL layer version: 2

### Debugging

To check the logs for a specific Lambda function:

```bash
aws logs get-log-events --log-group-name /aws/lambda/connect_more_get_events --log-stream-name $(aws logs describe-log-streams --log-group-name /aws/lambda/connect_more_get_events --order-by LastEventTime --descending --limit 1 --query 'logStreams[0].logStreamName' --output text)
```

To test your API locally:

```bash
# Test API endpoint with a valid Firebase token
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" https://cqyyqvabi8.execute-api.us-east-2.amazonaws.com/prod/events
```

### Database Schema

The application relies on a PostgreSQL database with the following main tables:

1. **events**: Stores event information
2. **event_instances**: Stores individual instances of recurring events
3. **event_categories**: Categories for events
4. **event_subcategories**: Subcategories for events
5. **event_venues**: Information about venues
6. **organizers**: Information about event organizers
7. **registrations**: Event registrations
8. **waitlists**: Waitlist entries for events that are at capacity

### Deployment Scripts

The repository contains several deployment scripts to help with different aspects of the setup:

- `deploy_all.py`: Deploy all Lambda functions
- `deploy_lambda.py`: Flexible deployment of Lambda functions
- `update_lightweight_layer.py`: Update the Lambda layer with dependencies
- `update_function_layers.py`: Update Lambda functions to use the latest layer
- `setup_api_gateway.py`: Configure API Gateway routes and integrations
- `setup_iam_permissions.py`: Set up required IAM permissions

## Development

### Project Structure

- `events/`: Lambda functions for event management
- `organizers/`: Lambda functions for organizer management
- `venues/`: Lambda functions for venue management
- `common/`: Shared utilities and models
- `utils/`: Helper functions
- `authorizer/`: Lambda authorizer for API Gateway
- `sql/`: Database schema and migrations

### Testing

To run tests:

```bash
python -m pytest tests/
```

### Adding New Functions

1. Create a new Python file in the appropriate folder
2. Implement the `lambda_handler` function
3. Deploy using the deployment scripts
4. Update API Gateway routes if needed

## License

This project is proprietary and confidential. 