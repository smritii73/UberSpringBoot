# Uber Ride Booking System

A distributed, real-time ride-sharing platform demonstrating microservices architecture, asynchronous messaging, and geospatial querying. This system manages the complete booking lifecycle: from request creation through driver-passenger matching to ride completion.

**Project Status**: Functional demonstration system | Built for learning distributed systems patterns | Not production-ready.

---

## System Overview

The platform coordinates three independent services to handle ride matching:

1. **Passenger** creates a booking request with pickup location
2. **Backend** queries Redis for nearby available drivers
3. **Socket Service** broadcasts the opportunity to matched drivers in real-time via WebSocket
4. **Driver** accepts/rejects through the frontend
5. **Backend** confirms the assignment and updates both passengers and drivers

---

## Architecture (3 Microservices)

### UberBackend Service (Port 8080)

REST API service responsible for core business logic:
- Driver and passenger lifecycle management (registration, updates, deletion)
- Booking creation, retrieval, and status management
- Geospatial driver discovery using Redis Geo-spatial queries
- Orchestration of booking notifications via gRPC to SocketService

**Key Components**:
- `BookingServiceImpl`: Business logic for booking lifecycle with transactional management
- `RedisLocationServiceImpl`: Geospatial queries to find drivers within configurable radius
- `GrpcClient`: Client stub for communicating with Socket Service
- REST Controllers: Standard CRUD endpoints with validation and error handling

### UberSocketService (Port 8082)

WebSocket message broker for real-time driver notifications:
- Maintains persistent WebSocket connections from drivers
- Broadcasts ride opportunities to subscribed drivers via STOMP message broker
- Receives driver acceptance messages and forwards to Backend via gRPC

**Key Components**:
- `SocketService`: Converts ride requests to driver notifications and broadcasts via WebSocket
- `RideNotificationServiceImpl`: gRPC service endpoint for receiving ride opportunities from Backend
- `WebSocketConfig`: Configures STOMP message broker with topic-based routing
- `SocketController`: Handles incoming driver messages (acceptance/rejection)

### Frontend Application (Port 8000)

Single-page application with role-based UI logic. No framework dependencies (vanilla JavaScript).

**Driver Interface**:
- Real-time WebSocket connection status indicator
- Incoming ride notification display with booking details
- Accept/reject ride functionality
- Booking history with status tracking

**Passenger Interface**:
- Booking creation with coordinate validation
- Real-time booking status polling (5-second refresh interval)
- Booking history and cancellation functionality
- Driver assignment tracking

**Technology Stack**: HTML5, CSS3, Vanilla JavaScript ES6+, SockJS, STOMP.js

---

## Technology Stack

| Layer | Component | Purpose |
|-------|-----------|---------|
| **Backend** | Java 17, Spring Boot 3.x | RESTful API, dependency injection, transactional management |
| **Build** | Gradle 9.2.1 | Dependency management and build automation |
| **Persistence** | MySQL 8.0 | Relational data storage with ACID compliance |
| **Caching/Geo** | Redis 6.0 | Geospatial indexing and proximity queries |
| **Service-to-Service** | gRPC + Protocol Buffers | Efficient inter-service communication |
| **Real-time** | WebSocket (STOMP) | Persistent bidirectional connections for notifications |
| **Frontend** | Vanilla JavaScript ES6+ | Lightweight client with SockJS + STOMP.js libraries |

---

## Core Technical Concepts

### Geospatial Driver Discovery
Nearby drivers are queried using Redis Geo-spatial commands (GEOADD, GEORADIUS):
- Driver locations stored as members in sorted set with geohash-encoded coordinates
- Proximity queries execute in sub-100ms for realistic scenarios
- Configurable search radius (kilometers)
- Returns sorted list of drivers by distance

### Real-time Messaging via WebSocket
Driver notifications delivered through persistent WebSocket connections:
- Drivers connect to `/ws-uber` endpoint with SockJS fallback
- Subscribe to topic `/topic/new-ride/{driverId}` via STOMP protocol
- Heartbeat mechanism maintains connection health (30-second intervals)
- Automatic reconnection with exponential backoff on disconnection (1s → 30s, max 5 attempts)

### Inter-service Communication via gRPC
High-performance RPC for service-to-service calls:
- Protocol Buffer message definitions ensure schema consistency
- Backend calls SocketService's `notifyDriversForNewRide()` with ride details
- SocketService calls Backend's `acceptRide()` when driver accepts
- Managed channels with plaintext communication (localhost only)

### Database Transaction Management
Booking lifecycle protected by Spring's `@Transactional` annotation:
- Write operations run within transactions with automatic rollback on exception
- Read operations use `readOnly=true` for query optimization
- Foreign key constraints maintain referential integrity
- JPA audit listeners automatically track creation and modification timestamps

---

## System Flow

```
1. Passenger initiates booking request with pickup coordinates
   │
2. Backend validates passenger and coordinates
   │
3. Redis proximity query: GEORADIUS on key "driver:geo"
   │ Returns list of drivers within 10km radius
   │
4. Backend initiates gRPC call to SocketService
   │ notifyDriversForNewRide(latitude, longitude, driverId[], bookingId)
   │
5. SocketService broadcasts via WebSocket to each driver's subscribed topic
   │ Topic: /topic/new-ride/{driverId}
   │ Payload: JSON with booking details and coordinates
   │
6. Driver receives notification in browser
   │
7. Driver clicks "Accept"
   │ Sends message to /app/ride-acceptance with driverId and bookingId
   │
8. SocketService receives acceptance and calls Backend via gRPC
   │ acceptRide(bookingId, driverId)
   │
9. Backend updates booking:
   │ - Sets driver_id and status to CONFIRMED
   │ - Sets driver.is_available to false (driver becomes unavailable)
   │ - Returns success response
   │
10. Passenger polling detects status change
    │ Displays: "Driver John assigned, arriving in 5 min"
```

---

## Technical Learning & Implementation Challenges

### gRPC and Protocol Buffers
Protocol Buffer definitions provide compile-time schema validation between services. Initial challenge was understanding the code generation workflow:
- Define `.proto` files with message and service definitions
- Gradle compiles to Java classes and service stubs
- Managed channels establish connections to remote gRPC servers
- Service implementation extends generated `ImplBase` class

Successfully implemented:
- Backend service calling SocketService for notifications
- SocketService calling Backend for ride acceptance
- Blocking stubs for synchronous request-response pattern

**Key Learning**: Protocol Buffers enforce contract between services, preventing runtime serialization errors common in REST APIs.

### WebSocket with STOMP Protocol
Understanding persistent bidirectional communication required separating concepts:
- **WebSocket**: Protocol for full-duplex communication over TCP
- **STOMP**: Frame-based messaging protocol on top of WebSocket
- **SockJS**: Client library providing WebSocket fallback transports

Implementation details:
- Drivers subscribe to `/topic/new-ride/{driverId}` on connection
- Backend publishes messages via `SimpMessagingTemplate.convertAndSend()`
- Clients automatically send heartbeats and detect stale connections
- Implemented exponential backoff reconnection on network failures (1s, 2s, 4s, 8s, 16s, 30s max)

**Challenge**: Debugged subscription routing by examining browser DevTools Network tab to verify STOMP frames.

### Geospatial Queries with Redis
Redis Geo-spatial commands abstract complex geohashing logic:
- **GEOADD**: Store driver with ID and coordinates in sorted set
- **GEORADIUS**: Query members within circular radius (returns sorted by distance)
- **GEOPOS**: Retrieve stored coordinates for driver

Implementation stores drivers as key `driver:geo` with members `{driverId: coordinates}`. Query executes in sub-100ms with realistic driver populations.

**Learning**: Geospatial databases optimize distance calculations versus computing distances in-application code.

### Transactional Consistency
Booking state changes must be atomic to prevent race conditions:
- Booking creation sets driver availability
- Status transitions release drivers appropriately
- @Transactional annotation on service methods ensures all-or-nothing semantics

**Challenge**: Handling partially failed operations (database succeeds, gRPC call fails) required implementing graceful degradation rather than rollback.

### Database Design
Normalized schema with relationships:
- Passenger (1) ← Booking → (1) Driver
- Foreign key constraints with LAZY loading to prevent N+1 queries
- Unique constraints on email and license fields
- JPA audit listeners for automatic timestamp management

**Learning**: LAZY loading prevents unnecessary database queries but requires careful handling in service layer.

---

## Setup & Deployment

### System Requirements
- Java Development Kit 17 or higher
- MySQL Server 8.0 or higher
- Redis Server 6.0 or higher
- Modern web browser with ES6 support

### Installation Steps

**1. Database Initialization**

Create the database and tables:
```bash
mysql -u root -p
CREATE DATABASE uber;
USE uber;
```

Tables will be created automatically on first application startup via JPA DDL auto-update.

**2. Build and Run UberBackend** (Port 8080, gRPC 9090)
```bash
cd UberBackend
./gradlew clean build
java -jar build/libs/UberBackend-0.0.1-SNAPSHOT.jar
```

Expected console output:
```
Tomcat started on port(s): 8080 (http)
gRPC Server started on port 9090
```

**3. Build and Run UberSocketService** (Port 8082, gRPC 9091)
```bash
cd UberSocketService
./gradlew clean build
java -jar build/libs/UberSocketService-0.0.1-SNAPSHOT.jar
```

Expected console output:
```
Tomcat started on port(s): 8082 (http)
gRPC Server started on port 9091
```

**4. Start Frontend Development Server** (Port 8000)
```bash
cd UberFrontend
# Option A: Python 3
python3 -m http.server 8000

# Option B: PHP
php -S localhost:8000

# Option C: Node.js (http-server package)
npx http-server -p 8000
```

**5. Access Application**
- Driver mode: `http://localhost:8000?role=driver&driverId=1`
- Passenger mode: `http://localhost:8000?role=passenger&passengerId=1`

---

---

## API Endpoints & Testing

### Driver Registration
```bash
curl -X POST http://localhost:8080/api/drivers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "9876543210",
    "licenseNumber": "DL123456",
    "vehicleModel": "Toyota Prius",
    "vehiclePlateNumber": "ABC123",
    "isAvailable": true
  }'
```

### Passenger Registration
```bash
curl -X POST http://localhost:8080/api/passengers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Smith",
    "email": "alice@example.com",
    "phoneNumber": "9123456789"
  }'
```

### Driver Location Update
```bash
curl -X POST http://localhost:8080/api/v1/location/driverLocation \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": 1,
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

### Create Booking (Triggers Real-time Notifications)
```bash
curl -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "passengerId": 1,
    "driverId": null,
    "pickupLocationLatitude": 40.7128,
    "pickupLocationLongitude": -74.0060,
    "dropoffLocation": "Times Square",
    "fare": 25.50
  }'
```

**Expected Flow**:
1. Booking created with status PENDING
2. Backend queries nearby drivers from Redis
3. Backend calls SocketService via gRPC to broadcast notification
4. Driver's browser receives real-time WebSocket message
5. Driver accepts via frontend
6. SocketService calls Backend via gRPC to confirm acceptance
7. Booking status changes to CONFIRMED
8. Passenger's polling request detects change and updates display

### Query Booking Status
```bash
curl http://localhost:8080/api/bookings/1
```

### Retrieve Driver Bookings
```bash
curl http://localhost:8080/api/bookings/driver/1
```

### Retrieve Passenger Bookings
```bash
curl http://localhost:8080/api/bookings/passenger/1
```

### Cancel Booking
```bash
curl -X PATCH http://localhost:8080/api/bookings/1/status?status=CANCELLED
```

---

## Project Structure

```
UberBackend/
├── src/main/java/.../
│   ├── controller/          # REST API endpoints
│   ├── service/            # Business logic
│   ├── entity/             # Database models
│   ├── dto/                # Request/Response objects
│   ├── repository/         # Database queries
│   ├── mapper/             # DTO ↔ Entity conversion
│   └── config/             # Spring configs (gRPC, Redis, etc)
├── src/main/proto/         # Protocol Buffer definitions (.proto files)
└── build.gradle            # Dependencies

UberSocketService/
├── src/main/java/.../
│   ├── controller/         # WebSocket message handlers
│   ├── service/            # Socket broadcasting logic
│   ├── client/             # gRPC client to backend
│   └── config/             # WebSocket config
└── src/main/proto/         # Same .proto files

UberFrontend/
├── index.html              # Single page app
├── js/
│   ├── config.js          # API URLs, WebSocket config
│   ├── api-client.js      # REST API calls
│   ├── websocket-client.js # WebSocket connection & subscription
│   ├── driver-handler.js  # Driver UI logic
│   ├── passenger-handler.js # Passenger UI logic
│   └── utils.js           # Helpers (validation, formatting, etc)
└── css/styles.css         # Styling
```

---

## Implementation Highlights

**Asynchronous Workflow Orchestration**: Successfully implemented non-blocking booking creation that returns immediately while driver notifications are broadcast in background via gRPC, preventing response latency from service-to-service communication delays.

**Real-time Connection Management**: Deployed resilient WebSocket client with exponential backoff reconnection strategy, handling network failures gracefully and maintaining state across disconnections.

**Geospatial Query Optimization**: Implemented sub-100ms proximity queries using Redis Geo-spatial commands, enabling scalable driver discovery without requiring full table scans.

**Transactional Data Consistency**: Employed Spring's @Transactional annotation to ensure booking state changes are atomic, maintaining referential integrity through multi-step state transitions.

**Polyglot RPC Communication**: Established efficient inter-service communication using gRPC + Protocol Buffers while maintaining REST endpoints for client-facing APIs, leveraging each protocol's strengths.

---

## Technology Stack Summary

| Category | Technologies |
|----------|---------------|
| **Language** | Java 17 with Spring Boot 3.x framework |
| **Build** | Gradle 9.2.1 |
| **Relational Data** | MySQL 8.0 with JPA/Hibernate ORM |
| **Caching & Geo** | Redis 6.0 with Jedis client |
| **Service Communication** | gRPC with Protocol Buffers |
| **Real-time Messaging** | WebSocket (STOMP protocol) with SockJS fallback |
| **Frontend** | Vanilla JavaScript ES6+, HTML5, CSS3 |
| **Frontend Libraries** | SockJS, STOMP.js |

---

## Project Status & Scope

- **Purpose**: Educational portfolio project to demonstrate distributed systems fundamentals
- **Development Timeline**: December 2025 - March 2026 (final semester)
- **Functional Status**: Complete; all core features working
- **Production Ready**: No; requires security hardening and operational monitoring
- **Code Quality**: Clean architecture with separation of concerns, but lacks comprehensive test coverage
- **Documentation**: API endpoints documented, deployment instructions provided

---
