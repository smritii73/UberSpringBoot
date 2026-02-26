/**
 * Passenger Mode Handler
 * REQ-PASSENGER-001 through REQ-PASSENGER-025
 */

const PassengerHandler = {
    passengerId: null,
    passengerInfo: null,
    activeBooking: null,
    bookingHistory: [],
    statusPollingInterval: null,

    /**
     * Initialize passenger mode
     */
    async init(passengerId) {
        this.passengerId = passengerId;
        
        // Load passenger information
        await this.loadPassengerInfo();
        
        // Load booking history
        await this.loadBookingHistory();
        
        // Render UI
        this.render();
    },

    /**
     * Load passenger information
     * REQ-PASSENGER-023, REQ-PASSENGER-024, REQ-PASSENGER-025
     */
    async loadPassengerInfo() {
        try {
            Utils.showLoading(document.getElementById('passenger-info-section'));
            const response = await ApiClient.getPassenger(this.passengerId);
            
            if (response.success && response.data) {
                this.passengerInfo = response.data;
                this.renderPassengerInfo();
            }
        } catch (error) {
            console.error('Error loading passenger info:', error);
            Utils.showError('Failed to load passenger information');
        } finally {
            Utils.hideLoading(document.getElementById('passenger-info-section'));
        }
    },

    /**
     * Load booking history
     * REQ-PASSENGER-012, REQ-PASSENGER-013, REQ-PASSENGER-014
     */
    async loadBookingHistory() {
        try {
            Utils.showLoading(document.getElementById('booking-history-section'));
            const response = await ApiClient.getPassengerBookings(this.passengerId);
            
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
     * Create new booking
     * REQ-PASSENGER-001, REQ-PASSENGER-002, REQ-PASSENGER-003, REQ-PASSENGER-004, REQ-PASSENGER-005, REQ-PASSENGER-006
     */
    async createBooking(bookingData) {
        // Validate required fields
        if (!bookingData.pickupLocationLatitude || !bookingData.pickupLocationLongitude) {
            Utils.showError('Pickup location is required');
            return;
        }

        // Validate coordinates
        if (!Utils.validateLatitude(bookingData.pickupLocationLatitude) ||
            !Utils.validateLongitude(bookingData.pickupLocationLongitude)) {
            Utils.showError('Invalid location coordinates');
            return;
        }

        // Prepare booking request
        const requestData = {
            passengerId: this.passengerId,
            driverId: null,
            pickupLocationLatitude: parseFloat(bookingData.pickupLocationLatitude),
            pickupLocationLongitude: parseFloat(bookingData.pickupLocationLongitude),
            dropoffLocation: bookingData.dropoffLocation || null,
            fare: bookingData.fare ? parseFloat(bookingData.fare) : null,
            scheduledPickupTime: bookingData.scheduledPickupTime || null
        };

        try {
            Utils.showLoading(document.getElementById('booking-form'));
            const response = await ApiClient.createBooking(requestData);
            
            if (response.success && response.data) {
                Utils.showSuccess(`Booking created successfully! Booking ID: ${response.data.id}`);
                
                // Set as active booking
                this.activeBooking = response.data;
                
                // Start polling for status updates
                this.startStatusPolling(response.data.id);
                
                // Reload booking history
                await this.loadBookingHistory();
                
                // Render active booking
                this.renderActiveBooking();
                
                // Reset form
                this.resetBookingForm();
            }
        } catch (error) {
            console.error('Error creating booking:', error);
            Utils.showError(error.message || 'Failed to create booking');
        } finally {
            Utils.hideLoading(document.getElementById('booking-form'));
        }
    },

    /**
     * Get booking details
     * REQ-PASSENGER-007, REQ-PASSENGER-008, REQ-PASSENGER-009
     */
    async getBookingDetails(bookingId) {
        try {
            const response = await ApiClient.getBooking(bookingId);
            
            if (response.success && response.data) {
                return response.data;
            }
        } catch (error) {
            console.error('Error getting booking details:', error);
            Utils.showError('Failed to load booking details');
        }
        return null;
    },

    /**
     * Start polling for booking status updates
     * REQ-PASSENGER-010
     */
    startStatusPolling(bookingId) {
        // Clear existing polling
        this.stopStatusPolling();
        
        // Poll for status updates
        this.statusPollingInterval = setInterval(async () => {
            const booking = await this.getBookingDetails(bookingId);
            if (booking) {
                // Update active booking if it's the same
                if (this.activeBooking && this.activeBooking.id === booking.id) {
                    const statusChanged = this.activeBooking.status !== booking.status;
                    this.activeBooking = booking;
                    
                    if (statusChanged) {
                        this.renderActiveBooking();
                        Utils.showNotification(`Booking status updated: ${booking.status}`, 'info');
                    }
                }
                
                // Stop polling if booking is completed or cancelled
                if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
                    this.stopStatusPolling();
                }
            }
        }, AppConfig.polling.bookingStatusInterval);
    },

    /**
     * Stop status polling
     */
    stopStatusPolling() {
        if (this.statusPollingInterval) {
            clearInterval(this.statusPollingInterval);
            this.statusPollingInterval = null;
        }
    },

    /**
     * Update booking
     * REQ-PASSENGER-015, REQ-PASSENGER-016
     */
    async updateBooking(bookingId, bookingData) {
        try {
            const response = await ApiClient.updateBooking(bookingId, bookingData);
            
            if (response.success && response.data) {
                Utils.showSuccess('Booking updated successfully');
                await this.loadBookingHistory();
                
                // Update active booking if it's the same
                if (this.activeBooking && this.activeBooking.id === bookingId) {
                    this.activeBooking = response.data;
                    this.renderActiveBooking();
                }
            }
        } catch (error) {
            console.error('Error updating booking:', error);
            Utils.showError(error.message || 'Failed to update booking');
        }
    },

    /**
     * Cancel booking
     * REQ-PASSENGER-017, REQ-PASSENGER-018
     */
    async cancelBooking(bookingId) {
        if (!confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        try {
            const response = await ApiClient.updateBookingStatus(bookingId, 'CANCELLED');
            
            if (response.success && response.data) {
                Utils.showSuccess('Booking cancelled successfully');
                
                // Stop polling
                this.stopStatusPolling();
                
                // Clear active booking if it's the same
                if (this.activeBooking && this.activeBooking.id === bookingId) {
                    this.activeBooking = null;
                    this.renderActiveBooking();
                }
                
                // Reload booking history
                await this.loadBookingHistory();
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
            Utils.showError(error.message || 'Failed to cancel booking');
        }
    },

    /**
     * Get nearby drivers (optional)
     * REQ-PASSENGER-019, REQ-PASSENGER-020, REQ-PASSENGER-021, REQ-PASSENGER-022
     */
    async getNearbyDrivers(latitude, longitude, radius = 5000) {
        if (!Utils.validateLatitude(latitude) || !Utils.validateLongitude(longitude)) {
            Utils.showError('Invalid location coordinates');
            return;
        }

        try {
            const response = await ApiClient.getNearbyDrivers(latitude, longitude, radius);
            
            if (response.success && response.data) {
                return response.data;
            }
        } catch (error) {
            console.error('Error getting nearby drivers:', error);
            Utils.showError('Failed to get nearby drivers');
        }
        return [];
    },

    /**
     * Render passenger information
     */
    renderPassengerInfo() {
        const section = document.getElementById('passenger-info-section');
        if (!section || !this.passengerInfo) return;

        section.innerHTML = `
            <h3>Passenger Information</h3>
            <div class="info-card">
                <p><strong>Name:</strong> ${Utils.sanitize(this.passengerInfo.name || 'N/A')}</p>
                <p><strong>Email:</strong> ${Utils.sanitize(this.passengerInfo.email || 'N/A')}</p>
                <p><strong>Phone:</strong> ${Utils.sanitize(this.passengerInfo.phoneNumber || 'N/A')}</p>
            </div>
        `;
    },

    /**
     * Render active booking
     * REQ-PASSENGER-009, REQ-PASSENGER-011
     */
    renderActiveBooking() {
        const container = document.getElementById('active-booking-container');
        if (!container) return;

        if (!this.activeBooking) {
            container.innerHTML = '<p>No active booking.</p>';
            return;
        }

        container.innerHTML = `
            <div class="booking-card active">
                <div class="booking-header">
                    <h3>Active Booking</h3>
                    <span class="status-badge ${Utils.getStatusClass(this.activeBooking.status)}">
                        ${this.activeBooking.status}
                    </span>
                </div>
                <div class="booking-body">
                    <p><strong>Booking ID:</strong> ${this.activeBooking.id}</p>
                    <p><strong>Status:</strong> ${this.activeBooking.status}</p>
                    ${this.activeBooking.driverName ? `
                        <p><strong>Driver:</strong> ${Utils.sanitize(this.activeBooking.driverName)}</p>
                    ` : '<p><strong>Driver:</strong> Not assigned yet</p>'}
                    <p><strong>Pickup:</strong> ${this.activeBooking.pickupLocationLatitude}, ${this.activeBooking.pickupLocationLongitude}</p>
                    ${this.activeBooking.dropoffLocation ? `
                        <p><strong>Dropoff:</strong> ${Utils.sanitize(this.activeBooking.dropoffLocation)}</p>
                    ` : ''}
                    ${this.activeBooking.fare ? `
                        <p><strong>Fare:</strong> $${this.activeBooking.fare}</p>
                    ` : ''}
                    <p><strong>Created:</strong> ${Utils.formatDateTime(this.activeBooking.createdAt)}</p>
                    ${this.activeBooking.scheduledPickupTime ? `
                        <p><strong>Scheduled:</strong> ${Utils.formatDateTime(this.activeBooking.scheduledPickupTime)}</p>
                    ` : ''}
                </div>
                <div class="booking-actions">
                    ${this.activeBooking.status === 'PENDING' || this.activeBooking.status === 'CONFIRMED' ? `
                        <button class="btn btn-cancel" onclick="PassengerHandler.cancelBooking(${this.activeBooking.id})">
                            Cancel Booking
                        </button>
                    ` : ''}
                    <button class="btn btn-refresh" onclick="PassengerHandler.refreshBooking(${this.activeBooking.id})">
                        Refresh Status
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Refresh booking
     */
    async refreshBooking(bookingId) {
        const booking = await this.getBookingDetails(bookingId);
        if (booking) {
            if (this.activeBooking && this.activeBooking.id === bookingId) {
                this.activeBooking = booking;
            }
            this.renderActiveBooking();
            await this.loadBookingHistory();
        }
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
                        <th>Status</th>
                        <th>Driver</th>
                        <th>Pickup Location</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.bookingHistory.map(booking => `
                        <tr>
                            <td>${booking.id}</td>
                            <td><span class="status-badge ${Utils.getStatusClass(booking.status)}">${booking.status}</span></td>
                            <td>${Utils.sanitize(booking.driverName || 'Not assigned')}</td>
                            <td>${booking.pickupLocationLatitude}, ${booking.pickupLocationLongitude}</td>
                            <td>${Utils.formatDateTime(booking.createdAt)}</td>
                            <td>
                                <button class="btn btn-small" onclick="PassengerHandler.viewBookingDetails(${booking.id})">
                                    View
                                </button>
                                ${booking.status === 'PENDING' || booking.status === 'CONFIRMED' ? `
                                    <button class="btn btn-small btn-cancel" onclick="PassengerHandler.cancelBooking(${booking.id})">
                                        Cancel
                                    </button>
                                ` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    /**
     * View booking details
     */
    async viewBookingDetails(bookingId) {
        const booking = await this.getBookingDetails(bookingId);
        if (booking) {
            alert(JSON.stringify(booking, null, 2));
        }
    },

    /**
     * Reset booking form
     */
    resetBookingForm() {
        const form = document.getElementById('booking-form');
        if (form) {
            form.reset();
        }
    },

    /**
     * Render main UI
     */
    render() {
        this.renderPassengerInfo();
        this.renderActiveBooking();
        this.renderBookingHistory();
    },

    /**
     * Cleanup on page unload
     */
    cleanup() {
        this.stopStatusPolling();
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PassengerHandler;
}

