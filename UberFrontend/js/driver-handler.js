/**
 * Driver Mode Handler
 * REQ-DRIVER-001 through REQ-DRIVER-024
 */

const DriverHandler = {
    driverId: null,
    driverInfo: null,
    activeNotifications: [],
    bookingHistory: [],

    /**
     * Initialize driver mode
     */
    async init(driverId) {
        this.driverId = driverId;
        
        // Load driver information
        await this.loadDriverInfo();
        
        // Load booking history
        await this.loadBookingHistory();
        
        // Setup WebSocket connection
        this.setupWebSocket();
        
        // Render UI
        this.render();
    },

    /**
     * Load driver information
     * REQ-DRIVER-019, REQ-DRIVER-020, REQ-DRIVER-021
     */
    async loadDriverInfo() {
        try {
            Utils.showLoading(document.getElementById('driver-info-section'));
            const response = await ApiClient.getDriver(this.driverId);
            
            if (response.success && response.data) {
                this.driverInfo = response.data;
                this.renderDriverInfo();
            }
        } catch (error) {
            console.error('Error loading driver info:', error);
            Utils.showError('Failed to load driver information');
        } finally {
            Utils.hideLoading(document.getElementById('driver-info-section'));
        }
    },

    /**
     * Load booking history
     * REQ-DRIVER-022, REQ-DRIVER-023, REQ-DRIVER-024
     */
    async loadBookingHistory() {
        try {
            Utils.showLoading(document.getElementById('booking-history-section'));
            const response = await ApiClient.getDriverBookings(this.driverId);
            
            if (response.success && response.data) {
                this.bookingHistory = response.data;
                this.renderBookingHistory();
            }
        } catch (error) {
            console.error('Error loading booking history:', error);
            Utils.showError('Failed to load booking history');
        } finally {
            Utils.hideLoading(document.getElementById('booking-history-section'));
        }
    },

    /**
     * Setup WebSocket connection
     * REQ-DRIVER-001, REQ-DRIVER-002, REQ-DRIVER-003, REQ-DRIVER-004, REQ-DRIVER-005
     */
    setupWebSocket() {
        // Initialize connection status to connecting
        this.updateConnectionStatus('connecting');
        this.updateConnectionMessage('Connecting to WebSocket server...');
        
        const topic = `${AppConfig.websocket.topicPrefix}/new-ride/${this.driverId}`;
        
        WebSocketClient.connect(
            // onConnect
            () => {
                this.updateConnectionStatus('connected');
                this.updateConnectionMessage('Connected! Listening for ride notifications...');
                this.subscribeToRideNotifications(topic);
            },
            // onDisconnect
            () => {
                this.updateConnectionStatus('disconnected');
                this.updateConnectionMessage('Disconnected from server. Attempting to reconnect...');
            },
            // onError
            (error) => {
                this.updateConnectionStatus('disconnected');
                this.updateConnectionMessage('Connection error. Please check if the server is running.');
                Utils.showError('WebSocket connection error');
            }
        );
    },

    /**
     * Subscribe to ride notifications
     * REQ-DRIVER-006, REQ-DRIVER-007, REQ-DRIVER-008, REQ-DRIVER-009
     */
    subscribeToRideNotifications(topic) {
        WebSocketClient.subscribe(topic, (notification) => {
            console.log('Received ride notification:', notification);
            
            // Add notification to active list
            this.activeNotifications.push({
                ...notification,
                timestamp: new Date(),
                id: Date.now()
            });
            
            // Render notification
            this.renderRideNotification(notification);
            
            // Show visual/audio alert
            this.showNotificationAlert(notification);
        });
    },

    /**
     * Show notification alert
     * REQ-DRIVER-008
     */
    showNotificationAlert(notification) {
        // Visual alert
        Utils.showNotification(
            `New ride request! Booking ID: ${notification.bookingId}`,
            'info'
        );
        
        // Audio alert (if browser supports it)
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OZURAJR6Hh8sBtJAUwgM/y2Yk3CB1ou+3nn00QDFCn4/C2YxwGOJHX8sx5LAUkd8fw3ZBACxRes+nrqFUUCkaf4PK+bCEGMYfR89OCMwYebsDv45lREAlHoeHywG0kBTCAz/LZiTcIHWi77eefTRAMUKfj8LZjHAY4kdfyzHksBSR3x/DdkEALFF6z6euoVRQKRp/g8r5sIQYxh9Hz04IzBh5uwO/jmVEQCUeh4fLAbSQF');
            audio.play().catch(() => {}); // Ignore errors
        } catch (e) {
            // Audio not supported or failed
        }
    },

    /**
     * Accept ride
     * REQ-DRIVER-010, REQ-DRIVER-011, REQ-DRIVER-012, REQ-DRIVER-013
     */
    async acceptRide(bookingId) {
        const message = {
            driverId: this.driverId,
            bookingId: bookingId
        };

        const success = WebSocketClient.send('/ride-acceptance', message);
        
        if (success) {
            Utils.showSuccess('Ride acceptance sent');
            
            // Remove from active notifications
            this.activeNotifications = this.activeNotifications.filter(
                n => n.bookingId !== bookingId
            );
            
            // Reload booking history
            await this.loadBookingHistory();
            
            // Update UI
            this.render();
        } else {
            Utils.showError('Failed to send ride acceptance');
        }
    },

    /**
     * Update driver location (optional)
     * REQ-DRIVER-015, REQ-DRIVER-016, REQ-DRIVER-017, REQ-DRIVER-018
     */
    async updateLocation(latitude, longitude) {
        if (!Utils.validateLatitude(latitude) || !Utils.validateLongitude(longitude)) {
            Utils.showError('Invalid location coordinates');
            return;
        }

        try {
            const response = await ApiClient.updateDriverLocation(
                this.driverId,
                latitude,
                longitude
            );
            
            if (response.success) {
                Utils.showSuccess('Location updated successfully');
            }
        } catch (error) {
            console.error('Error updating location:', error);
            Utils.showError('Failed to update location');
        }
    },

    /**
     * Update connection status display
     * REQ-DRIVER-003
     */
    updateConnectionStatus(status) {
        // Update header status
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = status.toUpperCase();
            statusElement.className = `connection-status ${Utils.getConnectionStatusClass(status)}`;
        }
        
        // Update connection panel status
        const panelStatusElement = document.getElementById('connection-status-text');
        if (panelStatusElement) {
            panelStatusElement.textContent = status.toUpperCase();
            panelStatusElement.className = `connection-status ${Utils.getConnectionStatusClass(status)}`;
        }
    },

    /**
     * Update connection message
     */
    updateConnectionMessage(message) {
        const messageElement = document.getElementById('connection-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
    },

    /**
     * Render driver information
     */
    renderDriverInfo() {
        const section = document.getElementById('driver-info-section');
        if (!section || !this.driverInfo) return;

        section.innerHTML = `
            <h3>Driver Information</h3>
            <div class="info-card">
                <p><strong>Name:</strong> ${Utils.sanitize(this.driverInfo.name || 'N/A')}</p>
                <p><strong>Email:</strong> ${Utils.sanitize(this.driverInfo.email || 'N/A')}</p>
                <p><strong>Phone:</strong> ${Utils.sanitize(this.driverInfo.phoneNumber || 'N/A')}</p>
                <p><strong>License:</strong> ${Utils.sanitize(this.driverInfo.licenseNumber || 'N/A')}</p>
                <p><strong>Vehicle:</strong> ${Utils.sanitize(this.driverInfo.vehicleModel || 'N/A')}</p>
                <p><strong>Plate:</strong> ${Utils.sanitize(this.driverInfo.vehiclePlateNumber || 'N/A')}</p>
                <p><strong>Available:</strong> ${this.driverInfo.isAvailable ? 'Yes' : 'No'}</p>
            </div>
        `;
    },

    /**
     * Render ride notification
     * REQ-DRIVER-008
     */
    renderRideNotification(notification) {
        const container = document.getElementById('ride-notifications-container');
        if (!container) return;

        const notificationElement = document.createElement('div');
        notificationElement.className = 'ride-notification-card';
        notificationElement.id = `notification-${notification.bookingId}`;
        notificationElement.innerHTML = `
            <div class="notification-header">
                <h4>New Ride Request</h4>
                <span class="timestamp">${Utils.formatDateTime(new Date())}</span>
            </div>
            <div class="notification-body">
                <p><strong>Booking ID:</strong> ${notification.bookingId}</p>
                <p><strong>Pickup Location:</strong> ${notification.pickUpLocationLatitude}, ${notification.pickUpLocationLongitude}</p>
            </div>
            <div class="notification-actions">
                <button class="btn btn-accept" onclick="DriverHandler.acceptRide(${notification.bookingId})">
                    Accept Ride
                </button>
                <button class="btn btn-reject" onclick="DriverHandler.rejectRide(${notification.bookingId})">
                    Reject
                </button>
            </div>
        `;

        container.insertBefore(notificationElement, container.firstChild);
    },

    /**
     * Reject ride
     */
    rejectRide(bookingId) {
        // Remove notification from active list
        this.activeNotifications = this.activeNotifications.filter(
            n => n.bookingId !== bookingId
        );
        
        // Remove from UI
        const notificationElement = document.getElementById(`notification-${bookingId}`);
        if (notificationElement) {
            notificationElement.remove();
        }
        
        Utils.showSuccess('Ride rejected');
    },

    /**
     * Render booking history
     */
    renderBookingHistory() {
        const container = document.getElementById('booking-history-container');
        if (!container) return;

        if (this.bookingHistory.length === 0) {
            container.innerHTML = '<p>No booking history available.</p>';
            return;
        }

        container.innerHTML = `
            <table class="booking-table">
                <thead>
                    <tr>
                        <th>Booking ID</th>
                        <th>Passenger</th>
                        <th>Status</th>
                        <th>Pickup Location</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.bookingHistory.map(booking => `
                        <tr>
                            <td>${booking.id}</td>
                            <td>${Utils.sanitize(booking.passengerName || 'N/A')}</td>
                            <td><span class="status-badge ${Utils.getStatusClass(booking.status)}">${booking.status}</span></td>
                            <td>${booking.pickupLocationLatitude}, ${booking.pickupLocationLongitude}</td>
                            <td>${Utils.formatDateTime(booking.createdAt)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    /**
     * Render main UI
     */
    render() {
        // Connection status is updated separately
        this.updateConnectionStatus(WebSocketClient.getConnectionStatus());
        
        // Render sections
        this.renderDriverInfo();
        this.renderBookingHistory();
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DriverHandler;
}

