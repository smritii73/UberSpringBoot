/**
 * Configuration for the Uber Frontend Application
 * REQ-CONF-001, REQ-CONF-002, REQ-CONF-003, REQ-CONF-004, REQ-CONF-005
 */

const AppConfig = {
    // UberSocket Service Configuration (WebSocket)
    websocket: {
        baseUrl: 'http://localhost:8082', // Fixed URL for WebSocket service
        endpoint: '/ws-uber',
        topicPrefix: '/topic',
        appPrefix: '/app',
        reconnectAttempts: 5,
        reconnectDelay: 1000, // Initial delay in ms
        reconnectMaxDelay: 30000, // Max delay in ms
        heartbeatInterval: 30000 // Heartbeat interval in ms
    },

    // Uber REST API Service Configuration
    api: {
        baseUrl: 'http://localhost:8080', // Default port for Uber service
        basePath: '/api',
        timeout: 30000, // 30 seconds
        retryAttempts: 3,
        retryDelay: 1000
    },

    // Polling Configuration (if implemented)
    polling: {
        bookingStatusInterval: 5000, // 5 seconds
        locationUpdateInterval: 10000 // 10 seconds (if implemented)
    },

    // UI Configuration
    ui: {
        notificationDuration: 5000, // Toast notification duration
        debounceDelay: 300 // Debounce delay for rapid actions
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
}

