/**
 * REST API Client
 * REQ-API-001 through REQ-API-010
 */

const ApiClient = {
    /**
     * Make API request
     * REQ-API-001, REQ-API-002, REQ-API-003, REQ-API-004, REQ-API-005
     */
    async request(endpoint, options = {}) {
        const url = `${AppConfig.api.baseUrl}${AppConfig.api.basePath}${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: AppConfig.api.timeout
        };

        const config = { ...defaultOptions, ...options };

        // Add body if present
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);

            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw {
                    status: response.status,
                    statusText: response.statusText,
                    message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
                    data: errorData
                };
            }

            const data = await response.json().catch(() => null);
            return { success: true, data };
        } catch (error) {
            if (error.name === 'AbortError') {
                throw { message: 'Request timeout', status: 408 };
            }
            throw error;
        }
    },

    /**
     * GET request
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    /**
     * POST request
     * REQ-API-006
     */
    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: body
        });
    },

    /**
     * PUT request
     */
    async put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: body
        });
    },

    /**
     * PATCH request
     */
    async patch(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpointWithParams = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(endpointWithParams, { method: 'PATCH' });
    },

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },

    // Driver API Methods
    // REQ-DRIVER-019, REQ-DRIVER-020, REQ-DRIVER-021
    async getDriver(driverId) {
        return this.get(`/drivers/${driverId}`);
    },

    // REQ-DRIVER-022, REQ-DRIVER-023, REQ-DRIVER-024
    async getDriverBookings(driverId) {
        return this.get(`/bookings/driver/${driverId}`);
    },

    // REQ-DRIVER-015, REQ-DRIVER-016, REQ-DRIVER-017
    async updateDriverLocation(driverId, latitude, longitude) {
        return this.post('/v1/location/driverLocation', {
            driverId: driverId,
            latitude: latitude,
            longitude: longitude
        });
    },

    // Passenger API Methods
    // REQ-PASSENGER-023, REQ-PASSENGER-024, REQ-PASSENGER-025
    async getPassenger(passengerId) {
        return this.get(`/passengers/${passengerId}`);
    },

    // REQ-PASSENGER-003, REQ-PASSENGER-004
    async createBooking(bookingData) {
        return this.post('/bookings', bookingData);
    },

    // REQ-PASSENGER-007, REQ-PASSENGER-008
    async getBooking(bookingId) {
        return this.get(`/bookings/${bookingId}`);
    },

    // REQ-PASSENGER-012, REQ-PASSENGER-013
    async getPassengerBookings(passengerId) {
        return this.get(`/bookings/passenger/${passengerId}`);
    },

    // REQ-PASSENGER-015, REQ-PASSENGER-016
    async updateBooking(bookingId, bookingData) {
        return this.put(`/bookings/${bookingId}`, bookingData);
    },

    // REQ-PASSENGER-017, REQ-PASSENGER-018
    async updateBookingStatus(bookingId, status) {
        return this.patch(`/bookings/${bookingId}/status`, { status });
    },

    // REQ-PASSENGER-019, REQ-PASSENGER-020, REQ-PASSENGER-021
    async getNearbyDrivers(latitude, longitude, radius) {
        return this.post('/v1/location/nearbyDrivers', {
            latitude: latitude,
            longitude: longitude,
            radius: radius
        });
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiClient;
}

