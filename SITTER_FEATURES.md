# Sitter Features Documentation

## Overview
This document describes the comprehensive sitter recommendation and rating system implemented for the pet sitting application. Users can now find sitters based on location, filter by services, and rate sitters with reviews.

## Database Schema Updates

### New Models Added:

1. **SitterProfile** - Extended profile information for sitters
2. **Service** - Services offered by sitters with pricing
3. **Rating** - User ratings and reviews for sitters

### Updated User Model:
- Added `perDayFee` - Sitter's daily rate
- Added `totalRating` - Average rating
- Added `totalReviews` - Number of reviews
- Added `experience` - Sitter's experience description
- Added `about` - Sitter's about section

## API Endpoints

### Sitter Recommendations (`/api/sitters`)

#### 1. Get Sitter Recommendations
```
GET /api/sitters/recommendations
Authorization: Bearer <token>
```

**Query Parameters:**
- `searchTerm` - Search by name, location, or about
- `location` - Filter by location
- `service` - Filter by service name
- `minPrice` - Minimum per-day fee
- `maxPrice` - Maximum per-day fee
- `minRating` - Minimum rating (1-5)
- `maxDistance` - Maximum distance in kilometers
- `userLat` - User's latitude
- `userLng` - User's longitude
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sortBy` - Sort field (default: totalRating)
- `sortOrder` - Sort order (asc/desc, default: desc)

**Response:**
```json
{
  "success": true,
  "message": "Sitter recommendations retrieved successfully",
  "data": [
    {
      "id": "sitter_id",
      "firstName": "John",
      "lastName": "Doe",
      "profileImage": "image_url",
      "location": "New York",
      "lat": 40.7128,
      "lng": -74.0060,
      "perDayFee": 50.0,
      "totalRating": 4.5,
      "totalReviews": 10,
      "experience": "5 years of pet sitting experience",
      "about": "I love animals and have experience with all types of pets",
      "distance": 2.5,
      "services": [
        {
          "id": "service_id",
          "name": "Dog Walking",
          "description": "Daily dog walking service",
          "price": 25.0
        }
      ],
      "sitterProfile": {
        "bio": "Professional pet sitter",
        "experience": "5 years",
        "education": "Veterinary Assistant Certificate",
        "certifications": ["Pet First Aid", "Dog Training"],
        "languages": ["English", "Spanish"],
        "availability": "Mon-Fri, 9AM-6PM"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPage": 3
  }
}
```

#### 2. Get Sitter Details
```
GET /api/sitters/:sitterId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Sitter details retrieved successfully",
  "data": {
    "id": "sitter_id",
    "firstName": "John",
    "lastName": "Doe",
    "profileImage": "image_url",
    "location": "New York",
    "lat": 40.7128,
    "lng": -74.0060,
    "perDayFee": 50.0,
    "totalRating": 4.5,
    "totalReviews": 10,
    "experience": "5 years of pet sitting experience",
    "about": "I love animals and have experience with all types of pets",
    "services": [...],
    "sitterProfile": {...},
    "ratings": [
      {
        "id": "rating_id",
        "rating": 5,
        "review": "Excellent service!",
        "createdAt": "2024-01-01T00:00:00Z",
        "user": {
          "id": "user_id",
          "firstName": "Jane",
          "lastName": "Smith",
          "profileImage": "user_image_url"
        }
      }
    ],
    "averageRating": 4.5
  }
}
```

### Rating System

#### 3. Rate a Sitter
```
POST /api/sitters/rate
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "review": "Excellent service! Very caring with my dog.",
  "sitterId": "sitter_id"
}
```

#### 4. Update Rating
```
PATCH /api/sitters/:sitterId/rate
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 4,
  "review": "Updated review"
}
```

#### 5. Delete Rating
```
DELETE /api/sitters/:sitterId/rate
Authorization: Bearer <token>
```

#### 6. Get User's Ratings
```
GET /api/sitters/ratings/my
Authorization: Bearer <token>
```

### Sitter Profile Management (`/api/users`)

#### 7. Update Sitter Profile
```
PATCH /api/users/sitter/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "perDayFee": 60.0,
  "experience": "3 years of professional pet sitting",
  "about": "I specialize in caring for senior dogs and cats",
  "location": "Brooklyn, NY",
  "lat": 40.6782,
  "lng": -73.9442
}
```

#### 8. Update Sitter Profile Details
```
PATCH /api/users/sitter/profile-details
Authorization: Bearer <token>
Content-Type: application/json

{
  "bio": "Professional pet sitter with veterinary background",
  "experience": "3 years",
  "education": "Veterinary Technology Degree",
  "certifications": ["Pet First Aid", "CPR Certified"],
  "languages": ["English", "French"],
  "availability": "Available 7 days a week, 24/7"
}
```

### Service Management

#### 9. Add Service
```
POST /api/users/sitter/services
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Overnight Pet Sitting",
  "description": "Stay overnight at your home to care for your pets",
  "price": 80.0
}
```

#### 10. Get Services
```
GET /api/users/sitter/services
Authorization: Bearer <token>
```

#### 11. Update Service
```
PATCH /api/users/sitter/services/:serviceId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Extended Overnight Pet Sitting",
  "price": 100.0
}
```

#### 12. Delete Service
```
DELETE /api/users/sitter/services/:serviceId
Authorization: Bearer <token>
```

## Features Implemented

### 1. Location-Based Recommendations
- Uses Haversine formula to calculate distances between users and sitters
- Sorts results by distance when user location is available
- Filters by maximum distance radius

### 2. Advanced Filtering
- Search by name, location, or about section
- Filter by price range (min/max per-day fee)
- Filter by minimum rating
- Filter by service type
- Pagination support

### 3. Rating System
- 1-5 star rating system
- Optional text reviews
- One rating per user per sitter
- Automatic calculation of average ratings
- Update and delete rating functionality

### 4. Sitter Profile Management
- Extended profile with bio, experience, education
- Certifications and languages support
- Availability information
- Per-day fee setting

### 5. Service Management
- Sitters can add multiple services
- Each service has name, description, and price
- Full CRUD operations for services

### 6. Security Features
- JWT authentication required for all endpoints
- Users can only rate sitters (not themselves)
- Sitters can only manage their own profiles and services
- Input validation using Zod schemas

## Distance Calculation

The system uses the Haversine formula to calculate distances between geographical coordinates:

```javascript
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};
```

## Usage Examples

### Finding Sitters Near You
```javascript
// Get sitters within 10km with minimum 4-star rating
const response = await fetch('/api/sitters/recommendations?maxDistance=10&minRating=4', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

### Rating a Sitter
```javascript
const rating = await fetch('/api/sitters/rate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    rating: 5,
    review: "Amazing service! My dog loved her!",
    sitterId: "sitter_id_here"
  })
});
```

### Updating Sitter Profile
```javascript
const update = await fetch('/api/users/sitter/profile', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    perDayFee: 75.0,
    experience: "5 years of professional pet sitting",
    location: "Manhattan, NY"
  })
});
```

## Error Handling

The system includes comprehensive error handling for:
- Invalid rating values (must be 1-5)
- Duplicate ratings (one per user per sitter)
- Self-rating prevention
- Invalid sitter IDs
- Missing authentication
- Validation errors

## Performance Considerations

- Pagination implemented for large result sets
- Efficient database queries with proper indexing
- Distance calculations done in application layer
- Caching considerations for frequently accessed data

## Future Enhancements

Potential improvements could include:
- Real-time availability updates
- Booking system integration
- Photo galleries for sitters
- Advanced search filters
- Recommendation algorithms based on user preferences
- Push notifications for new ratings
- Analytics dashboard for sitters 