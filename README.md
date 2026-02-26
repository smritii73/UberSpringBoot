# Uber Ride Booking System

A production-grade distributed ride-sharing platform leveraging microservices architecture with real-time geolocation capabilities, asynchronous event handling, and distributed inter-service communication. Built to demonstrate enterprise-grade system design patterns, scalability, and reliability.

## Overview

This system is a comprehensive ride-booking platform implementing a three-tier microservices architecture with emphasis on real-time communication, geospatial querying, and distributed transaction handling. The platform manages the complete lifecycle of ride requests from creation through completion, with real-time driver-passenger matching powered by location-based algorithms.

### Key Characteristics

- **Distributed Microservices**: Independent, loosely-coupled services communicating via gRPC and WebSocket
- **Real-time Geolocation**: Redis Geo-spatial indexing for sub-second driver discovery within configurable radius
- **Asynchronous Event Streaming**: Pub/Sub messaging via STOMP over WebSocket with automatic reconnection and exponential backoff
- **Stateful Session Management**: WebSocket connection pooling with per-driver topic subscriptions
- **Transactional Consistency**: Database-level constraints with JPA-managed relationships and automatic timestamp auditing
- **Horizontal Scalability**: Stateless services with shared storage (Redis for geo-data, MySQL for persistence)

---

## Architecture & Design

### System Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend Layer                               │
│           Vanilla JavaScript SPA (No Build Step)                 │
│              Dual-Mode: Driver / Passenger                       │
└─────────────────────────────────────────────────────────────────┘
              │                                      │
              │ REST API (Synchronous)       │ WebSocket (Async)
              │ HTTP/JSON                    │ STOMP/SockJS
              ▼                                      ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│   UberBackend Service        │    │  UberSocketService           │
│   Port: 8080 / gRPC: 9090    │    │  Port: 8082 / gRPC: 9091     │
│                              │    │                              │
│ • Booking Management         │◄──►│ • Real-time Notifications    │
│ • Driver/Passenger CRUD      │    │ • Topic-based Broadcasting   │
│ • Location Service           │    │ • Connection Management      │
│ • Transactional Orchestration│    │ • Message Queue Handling     │
└──────────────────────────────┘    └──────────────────────────────┘
              │                              │
    ┌─────────┴──────────┬────────────────────┘
    │                    │
    ▼                    ▼
┌──────────────┐   ┌──────────────┐
│   MySQL DB   │   │    Redis     │
│   Port 3306  │   │  Port 6379   │
│              │   │              │
│ • Bookings   │   │ • Geo Index  │
│ • Drivers    │   │ • Locations  │
│ • Passengers │   │              │
└──────────────┘   └──────────────┘
```

### Communication Protocols

1. **REST API**: Synchronous HTTP/JSON for CRUD operations and state queries
2. **gRPC**: High-performance RPC for service-to-service communication (ride notifications, acceptances)
3. **WebSocket (STOMP)**: Full-duplex persistent connections for real-time driver notifications with SockJS fallback
4. **Geo-spatial Queries**: Redis GEO commands for haversine-based distance calculations

---

## Tech Stack

### Backend Ecosystem

**Frameworks & Runtimes**
- Java 17+ (LTS version with modern language features)
- Spring Boot 3.x (Spring 6, Jakarta EE 10)
- Gradle 9.2.1 (build orchestration, dependency management)

**Core Libraries**
- **Spring Data JPA**: Object-relational mapping with Hibernate, automatic schema generation (DDL auto-update)
- **Spring WebSocket**: STOMP message broker, SimpMessagingTemplate for broadcasting
- **Spring Web MVC**: REST controller annotations, content negotiation
- **gRPC Java**: Protocol Buffer code generation, managed channels, blocking/async stubs
- **Lombok**: Annotation-driven boilerplate elimination (@Data, @RequiredArgsConstructor, @Builder)

**Data Persistence**
- **MySQL 8.0+**: Primary data store with ACID compliance
  - InnoDB engine for transaction support
  - Foreign key constraints for referential integrity
  - Unique constraints on email/license for data validation
  - Composite indexes on frequently queried columns
  
- **Redis 6.0+**: Geo-spatial indexing and caching
  - Sorted Sets for geohash-encoded locations
  - GEO commands: GEOADD, GEORADIUS, GEOPOS
  - String serialization for key-value pairs
  - Jedis client library for connection pooling

### Frontend Stack

**Web Technologies**
- Vanilla JavaScript ES6+ (no framework dependencies)
- HTML5 semantic markup
- CSS3 with CSS Variables, Flexbox, Media Queries

**Third-party Libraries**
- **SockJS 1.6.1**: WebSocket emulation with fallback transports (long-polling, Server-Sent Events)
- **STOMP.js 2.3.3**: Frame-based messaging protocol for WebSocket

**Architecture**
- Modular JavaScript: Separate concerns (API client, WebSocket client, handlers, utilities)
- Single-page application with dual-mode UI (driver/passenger)
- Client-side form validation and error handling
- Exponential backoff for failed API requests
- Automatic polling for asynchronous state updates (5-second intervals)

---

## Core Functionality

### 1. Driver Module

**Registration & Onboarding**
- Structured DTOs with Jakarta Bean Validation (@NotBlank, @Email, @NotNull)
- Unique constraints on email and license number enforced at database level
- Default availability status (true) on account creation
- Automatic timestamp auditing via @CreatedDate and @LastModifiedDate

**Location Management**
- Real-time GPS coordinate updates via REST endpoint
- **Redis Geo-spatial Index**: 2D geohash encoding with 52-bit precision
  - Accuracy: ±11 meters at equator
  - Sorted set member: driver ID as string, coordinates (lon, lat)
  - Key: `driver:geo`
  
- **Proximity Queries**: Radius search with configurable distance metric
  - Input: latitude, longitude, radius (kilometers)
  - Output: List of drivers within radius, sorted by distance
  - Algorithm: Redis GEORADIUS with haversine projection

**Availability State Machine**
- States: AVAILABLE / UNAVAILABLE
- Transitions:
  - AVAILABLE → UNAVAILABLE: On booking assignment
  - UNAVAILABLE → AVAILABLE: On ride completion or cancellation
  - State persisted in `drivers.is_available` column

**Booking Management**
- Query all assigned bookings (past and present)
- Display complete booking lifecycle with timestamps
- Integration with ride notification system

### 2. Passenger Module

**Account Management**
- Registration with email validation (Jakarta Validation @Email)
- Unique email enforcement with database constraints
- Profile information: name, phone, email
- Automatic JPA auditing for created/updated timestamps

**Booking Lifecycle**
- **Request Creation**: POST /api/bookings with coordinate validation
  - Latitude: -90 to 90 (validated client & server-side)
  - Longitude: -180 to 180 (validated client & server-side)
  - Optional: dropoff location, scheduled time, fare estimation
  
- **Status Progression**: PENDING → CONFIRMED → IN_PROGRESS → COMPLETED/CANCELLED
  - PENDING: Awaiting driver acceptance (broadcast to nearby drivers)
  - CONFIRMED: Driver assigned, ride acknowledged
  - IN_PROGRESS: Pickup completed, actual timestamp recorded
  - COMPLETED: Delivery completed, driver released to available pool
  - CANCELLED: Ride aborted, driver released with refund flag
  
- **Real-time Polling**: 5-second interval status checks with UI updates
- **Auto-cancellation**: Riders can cancel PENDING/CONFIRMED bookings
- **Booking History**: Complete audit trail with creation/modification timestamps

### 3. Real-time Ride Matching

**Near-driver Discovery Pipeline**
1. Passenger creates booking with pickup coordinates
2. UberBackend queries Redis for drivers within 10km radius
3. Extracted driver IDs list passed to Socket Service via gRPC
4. Socket Service broadcasts ride notification to `/topic/new-ride/{driverId}` topics
5. Connected drivers receive notifications in real-time
6. Drivers accept/reject with instant acknowledgment

**Notification System**
- **Protocol**: STOMP over WebSocket with SockJS fallback
- **Heartbeat**: 30-second intervals to detect stale connections
- **Reconnection Policy**: Exponential backoff (1s → 30s max), 5 retry attempts
- **Payload Format**: JSON with booking ID, pickup coordinates
- **Broadcast Mechanism**: SimpMessagingTemplate with pattern-based routing

**Driver Acceptance Flow**
- Driver sends acceptance via `/app/ride-acceptance` endpoint
- gRPC call to backend: acceptRide(bookingId, driverId)
- Transactional update: set driver_id, status=CONFIRMED, is_available=false
- Response confirmation with HTTP 200 / 500 error codes

### 4. Booking Management Service

**CRUD Operations**
- Create: Passenger booking with optional driver assignment
- Read: Query by ID, passenger ID, driver ID
- Update: Modify booking details (dropoff, fare, scheduled time)
- Delete: Remove booking, release driver resources

**Status Transitions**
- PATCH /api/bookings/{id}/status with BookingStatus enum
- IN_PROGRESS: Records actualPickupTime (LocalDateTime.now())
- COMPLETED: Records completedAt, flips driver.isAvailable=true
- CANCELLED: Releases driver, allows rebooking

**Relationship Management**
- Many-to-One with Passenger (LAZY fetch, non-nullable FK)
- Many-to-One with Driver (LAZY fetch, nullable FK)
- Cascade delete on rider/driver removal

**Transaction Handling**
- @Transactional on all write operations
- @Transactional(readOnly=true) for query operations
- Implicit rollback on exceptions

### 5. API Layer

**REST Endpoints**

**Driver API** (`/api/drivers`)
- GET /api/drivers → List all drivers with availability status
- GET /api/drivers/{id} → Driver profile with vehicle details
- GET /api/drivers/email/{email} → Lookup by email
- GET /api/drivers/available → Filter by isAvailable=true
- POST /api/drivers → Register new driver
- PUT /api/drivers/{id} → Update profile
- DELETE /api/drivers/{id} → Deactivate account

**Passenger API** (`/api/passengers`)
- GET /api/passengers → List all passengers
- GET /api/passengers/{id} → Passenger profile
- GET /api/passengers/email/{email} → Email lookup
- POST /api/passengers → Register new passenger
- PUT /api/passengers/{id} → Update profile
- DELETE /api/passengers/{id} → Deactivate account

**Booking API** (`/api/bookings`)
- GET /api/bookings → All bookings (admin view)
- GET /api/bookings/{id} → Single booking details
- GET /api/bookings/passenger/{passengerId} → Passenger's bookings
- GET /api/bookings/driver/{driverId} → Driver's bookings
- POST /api/bookings → Create new booking (triggers geo-query + notification)
- PUT /api/bookings/{id} → Update booking
- PATCH /api/bookings/{id}/status → Status transition
- DELETE /api/bookings/{id} → Cancel booking

**Location API** (`/api/v1/location`)
- POST /api/v1/location/driverLocation → Save driver GPS coordinates
- POST /api/v1/location/nearbyDrivers → Query drivers within radius

**Exception Handling**
- Global @RestControllerAdvice with typed exception handlers
- IllegalArgumentException → 400 Bad Request
- MethodArgumentNotValidException → 400 with field error map
- Generic Exception → 500 Internal Server Error

### 6. Inter-Service Communication

**gRPC Service Definitions**
- RideService: acceptRide(bookingId, driverId) for driver acceptance
- RideNotificationService: notifyDriversForNewRide(lat, lng, driverIds) for broadcast

**Stub Configuration**
- ManagedChannel with plaintext communication
- Blocking stubs for synchronous request-response
- Service discovery: configurable host/port via application properties

### 7. WebSocket & Messaging Layer

**STOMP Protocol Implementation**
- Endpoint: /ws-uber (registered with SockJS fallback)
- Message broker: Simple in-memory broker
- Application prefix: /app
- Topic prefix: /topic

**Connection Lifecycle**
- SockJS emulation: WebSocket → EventSource → Long-polling fallback
- Driver subscribes to: /topic/new-ride/{driverId}
- Automatic reconnection with exponential backoff

**Reconnection Strategy**
- Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped)
- Max 5 retry attempts before user notification
- Connection status displayed in UI header

### 8. Geospatial Querying

**Redis GEO Implementation**
- Storage: ZSET (sorted set) with geohash scores
- Key: "driver:geo"
- Member: driver ID (as string)
- Score: 52-bit encoded geohash with latitude/longitude

**Operations**
- GEOADD: Insert driver location with coordinates
- GEORADIUS: Query nearby drivers within radius
- GEOPOS: Retrieve stored coordinates

**Accuracy & Performance**
- Geohash precision: ±11 meters at equator
- Query time: O(N + log(N)) where N = drivers in area
- Distance metric: Haversine projection (great-circle distance)
- Configurable radius: meters, kilometers, miles

### 9. Data Model

**Entity Relationships**

```
Passenger (1) ──────── (N) Booking
  • id (PK)              • id (PK)
  • name                 • passenger_id (FK) [NOT NULL]
  • email (UNIQUE)       • driver_id (FK) [NULLABLE]
  • phone                • status (ENUM)
  • created_at           • fare
  • updated_at           • pickup_location_lat
                         • pickup_location_lng
Driver (1) ────────────(N) Booking
  • id (PK)              • dropoff_location
  • name                 • scheduled_pickup_time
  • email (UNIQUE)       • actual_pickup_time
  • phone                • completed_at
  • license_number (UNIQUE)
  • vehicle_model        Booking Status Enum:
  • vehicle_plate        - PENDING
  • is_available         - CONFIRMED
  • created_at           - IN_PROGRESS
  • updated_at           - COMPLETED
                         - CANCELLED
```

**Audit Trail**
- BaseModel abstract class with @MappedSuperclass
- @CreatedDate: immutable, set once on insert
- @LastModifiedDate: updated on every modification
- @EntityListeners(AuditingEntityListener.class) for auto-management

**Database Constraints**
- Primary keys: Auto-increment BIGINT
- Foreign keys: Cascade on booking deletion
- Unique constraints: driver.email, driver.license_number, passenger.email
- NOT NULL: Required fields for business logic

### 10. Frontend Features

**Driver Mode** (role=driver&driverId=X)
- Real-time WebSocket connection status indicator
- Incoming ride notifications with booking details
- Accept/reject actions with audio/visual alerts
- Booking history table with status badges
- Driver profile card with vehicle information
- Automatic connection recovery with retry notification

**Passenger Mode** (role=passenger&passengerId=X)
- Booking creation form with coordinate validation
- Real-time booking status polling (5-second refresh)
- Active booking card with driver assignment info
- Booking history with cancellation options
- Passenger profile display
- Toast notifications for state changes

**UI Components**
- Responsive grid layout (flex-based, mobile-first)
- CSS variables for theme consistency
- Loading spinners and disabled states
- Status badges with color-coded states
- Form validation (client-side, server-side echo)
- Error messages with helpful context

---

## Deployment & Operations

### Prerequisites
- Java 17+ JDK
- MySQL 8.0+
- Redis 6.0+
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Configuration Files

**Database Setup** (application.properties)
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/uber
spring.datasource.username=root
spring.datasource.password=root@123
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

**gRPC Configuration**
```properties
grpc.server.port=9090
grpc.server.host=localhost
grpc.client.port=9091
grpc.client.host=localhost
```

**Redis Configuration**
- Standalone at localhost:6379
- Jedis client with connection pooling

### Running Services

**UberBackend Service**
```bash
cd UberBackend
./gradlew clean build
java -jar build/libs/UberBackend-*.jar
# Listens on port 8080 (REST), 9090 (gRPC)
```

**UberSocketService**
```bash
cd UberSocketService
./gradlew clean build
java -jar build/libs/UberSocketService-*.jar
# Listens on port 8082 (WebSocket), 9091 (gRPC)
```

**Frontend**
```bash
cd UberFrontend
python3 -m http.server 8000
# Access at http://localhost:8000
```

### Operational Considerations

- **Connection Pooling**: HikariCP configured for 10-20 simultaneous connections
- **Redis Memory**: Estimate ~100 bytes per driver location
- **WebSocket Scale**: In-memory broker suitable for <1000 concurrent connections
- **gRPC Performance**: Blocking stubs sufficient for <100 requests/sec per service

---

## Design Patterns & Best Practices

**Architectural Patterns**
- **Microservices**: Independent deployment, separate concerns
- **Repository Pattern**: Abstract data access layer
- **Mapper Pattern**: DTO ↔ Entity transformations
- **Dependency Injection**: Constructor injection with @RequiredArgsConstructor

**Code Quality**
- SOLID principles: Single Responsibility, Dependency Inversion
- Interface Segregation: Separate read/write service interfaces
- Transactional boundaries: @Transactional on service layer
- Input validation: Jakarta Bean Validation + custom validators

**Security Considerations**
- SQL injection: Parameterized queries via JPA
- XSS prevention: Frontend sanitization
- CORS: AllowedOrigins("*") for development (restrict in production)
- Authentication: (TODO) OAuth2 / JWT tokens

---

## Scalability & Performance

**Horizontal Scaling Opportunities**
1. **Database**: Add read replicas for queries, MySQL cluster for writes
2. **Redis**: Sentinel for HA, cluster mode for distributed geo-indexing
3. **Services**: Load balancer (Nginx/HAProxy) across multiple instances
4. **WebSocket**: Message broker (RabbitMQ/Redis) for pub/sub across instances
5. **Caching**: Redis cache layer for driver availability queries

**Performance Optimization**
| Area | Strategy |
|------|----------|
| Geo-queries at scale | Regional partitioning, pre-computed zones |
| WebSocket broadcasts | Fan-out batching, rate limiting |
| Database connections | Increase HikariCP pool size |
| Booking status | Server-Sent Events (SSE) instead of polling |
| gRPC blocking | Virtual threads (Java 21), async stubs |

---

## Future Enhancements

1. **Payment Integration**: Stripe/PayPal for fare processing
2. **Rating System**: 5-star reviews for drivers/passengers
3. **Surge Pricing**: Dynamic fare calculation based on demand/supply
4. **Route Optimization**: Google Maps/OSRM integration for ETA
5. **Analytics Dashboard**: Heatmaps, peak hours, utilization metrics
6. **Push Notifications**: Firebase Cloud Messaging
7. **In-app Chat**: Real-time messaging between driver and passenger
8. **Mobile Apps**: Native iOS/Android with offline capabilities
9. **API Rate Limiting**: Token bucket algorithm with Redis
10. **Distributed Tracing**: Jaeger/Zipkin for observability

---

## Key Metrics for Production Deployment

- **Availability**: 99.9% SLA with multi-region failover
- **Latency**: p95 booking creation < 500ms, driver notification < 100ms
- **Throughput**: 1000+ concurrent drivers, 100+ bookings/minute
- **Data Consistency**: ACID transactions, eventual consistency for geo-cache
