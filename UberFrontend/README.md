# Uber Ride Booking System - Frontend Application

A plain JavaScript frontend application for the Uber Ride Booking System that connects to WebSocket and REST API services. Supports both driver and passenger modes.

## Features

### Driver Mode
- Real-time WebSocket connection for receiving ride notifications
- Accept/reject ride requests via WebSocket
- View driver information and booking history
- Optional location updates

### Passenger Mode
- Create new ride bookings via REST API
- Track booking status with automatic polling
- View booking history
- Cancel bookings

## Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Backend services running:
  - UberSocket service (WebSocket) - default port: 8082
  - Uber REST API service - default port: 8080

## Installation

1. Clone or download this frontend folder
2. No build step required - this is a static HTML/CSS/JavaScript application
3. Serve the files using a web server

## Running the Application

### Option 1: Using a Local Web Server

#### Python 3
```bash
cd frontend
python3 -m http.server 8000
```

#### Node.js (http-server)
```bash
npm install -g http-server
cd frontend
http-server -p 8000
```

#### PHP
```bash
cd frontend
php -S localhost:8000
```

### Option 2: Using VS Code Live Server
1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Option 3: Direct File Access
Simply open `index.html` in a web browser (note: some features may not work due to CORS restrictions)

## Usage

### Driver Mode

Access the application with driver parameters:
```
http://localhost:8000/index.html?role=driver&driverId=1
```

**Parameters:**
- `role`: Must be `"driver"`
- `driverId`: Integer ID of the driver

**Features:**
- Automatically connects to WebSocket
- Subscribes to ride notifications for the specified driver
- Displays incoming ride requests in real-time
- Allows accepting/rejecting rides
- Shows booking history

### Passenger Mode

Access the application with passenger parameters:
```
http://localhost:8000/index.html?role=passenger&passengerId=1
```

**Parameters:**
- `role`: Must be `"passenger"`
- `passengerId`: Integer ID of the passenger

**Features:**
- Create new bookings with pickup/dropoff locations
- View active booking status (auto-refreshes)
- View booking history
- Cancel bookings

## Configuration

Edit `js/config.js` to configure service endpoints:

```javascript
const AppConfig = {
    websocket: {
        baseUrl: 'http://localhost:8082',  // UberSocket service URL
        endpoint: '/ws-uber',
        reconnectAttempts: 5
    },
    api: {
        baseUrl: 'http://localhost:8080',  // Uber REST API service URL
        basePath: '/api',
        timeout: 30000
    }
};
```

## File Structure

```
frontend/
├── index.html              # Main HTML file
├── css/
│   └── styles.css         # Application styles
├── js/
│   ├── config.js          # Configuration
│   ├── utils.js           # Utility functions
│   ├── api-client.js      # REST API client
│   ├── websocket-client.js # WebSocket client
│   ├── driver-handler.js  # Driver mode logic
│   └── passenger-handler.js # Passenger mode logic
└── README.md              # This file
```

## API Integration

### REST API Endpoints Used

**Driver Endpoints:**
- `GET /api/drivers/{id}` - Get driver details
- `GET /api/bookings/driver/{driverId}` - Get driver bookings
- `POST /api/v1/location/driverLocation` - Update driver location

**Passenger Endpoints:**
- `GET /api/passengers/{passengerId}` - Get passenger details
- `POST /api/bookings` - Create booking
- `GET /api/bookings/{id}` - Get booking details
- `GET /api/bookings/passenger/{passengerId}` - Get passenger bookings
- `PUT /api/bookings/{id}` - Update booking
- `PATCH /api/bookings/{id}/status` - Update booking status
- `POST /api/v1/location/nearbyDrivers` - Find nearby drivers

### WebSocket Integration

**Connection:**
- Endpoint: `/ws-uber` (SockJS)
- Protocol: STOMP over WebSocket

**Driver Subscriptions:**
- Topic: `/topic/new-ride/{driverId}` - Receive ride notifications

**Message Sending:**
- Destination: `/app/ride-acceptance`
- Payload: `{ driverId: number, bookingId: number }`

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Requires:
- ES6+ JavaScript support
- WebSocket API support
- Fetch API support

## Troubleshooting

### WebSocket Connection Issues
- Ensure UberSocket service is running on the configured port
- Check CORS settings on the backend
- Verify the WebSocket endpoint URL in `config.js`
- Check browser console for connection errors

### REST API Issues
- Ensure Uber REST API service is running
- Verify the API base URL in `config.js`
- Check CORS settings on the backend
- Verify query parameters are correct

### Invalid Query Parameters
- Ensure `role` is either "driver" or "passenger"
- Ensure `driverId` is provided when role=driver
- Ensure `passengerId` is provided when role=passenger
- IDs must be valid integers

## Development

### Adding New Features
1. Follow the existing code structure
2. Add new functions to appropriate handler files
3. Update UI in `index.html` and `styles.css`
4. Test in both driver and passenger modes

### Debugging
- Open browser developer tools (F12)
- Check Console tab for errors and logs
- Check Network tab for API requests
- Check WebSocket connection in Network tab

## Security Notes

- This is a frontend-only application
- No authentication/authorization is implemented
- User IDs are passed via query parameters
- For production, implement proper authentication
- Use HTTPS in production environments

## License

This is a demonstration application for the Uber Ride Booking System.

## Support

For issues or questions, refer to the main project documentation or contact the development team.

