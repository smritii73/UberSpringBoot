/**
 * Utility Functions
 * REQ-VAL-001 through REQ-VAL-008, REQ-ERR-001 through REQ-ERR-009
 */

const Utils = {
    /**
     * Parse query parameters from URL
     * REQ-VAL-001, REQ-VAL-002, REQ-VAL-003, REQ-VAL-004
     */
    getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            role: params.get('role'),
            driverId: params.get('driverId') ? parseInt(params.get('driverId'), 10) : null,
            passengerId: params.get('passengerId') ? parseInt(params.get('passengerId'), 10) : null
        };
    },

    /**
     * Validate query parameters
     * REQ-VAL-001, REQ-VAL-002, REQ-VAL-003, REQ-VAL-004
     */
    validateQueryParams(params) {
        const errors = [];

        if (!params.role || (params.role !== 'driver' && params.role !== 'passenger')) {
            errors.push('Invalid or missing role parameter. Must be "driver" or "passenger".');
        }

        if (params.role === 'driver' && (!params.driverId || isNaN(params.driverId))) {
            errors.push('Missing or invalid driverId parameter for driver role.');
        }

        if (params.role === 'passenger' && (!params.passengerId || isNaN(params.passengerId))) {
            errors.push('Missing or invalid passengerId parameter for passenger role.');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Validate latitude
     * REQ-VAL-005
     */
    validateLatitude(lat) {
        const num = parseFloat(lat);
        return !isNaN(num) && num >= -90 && num <= 90;
    },

    /**
     * Validate longitude
     * REQ-VAL-005
     */
    validateLongitude(lng) {
        const num = parseFloat(lng);
        return !isNaN(num) && num >= -180 && num <= 180;
    },

    /**
     * Sanitize string to prevent XSS
     * REQ-VAL-006, REQ-VAL-007
     */
    sanitize(str) {
        if (typeof str !== 'string') return str;
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Format date/time
     */
    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString();
        } catch (e) {
            return dateString;
        }
    },

    /**
     * Debounce function
     * REQ-PERF-006
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Show toast notification
     * REQ-UI-018
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, AppConfig.ui.notificationDuration);
    },

    /**
     * Show error notification
     * REQ-ERR-006
     */
    showError(message) {
        Utils.showNotification(message, 'error');
        console.error(message); // REQ-ERR-007
    },

    /**
     * Show success notification
     */
    showSuccess(message) {
        Utils.showNotification(message, 'success');
    },

    /**
     * Show loading indicator
     * REQ-UI-017
     */
    showLoading(element) {
        if (element) {
            element.classList.add('loading');
        }
    },

    /**
     * Hide loading indicator
     */
    hideLoading(element) {
        if (element) {
            element.classList.remove('loading');
        }
    },

    /**
     * Get status badge class
     * REQ-UI-019
     */
    getStatusClass(status) {
        const statusMap = {
            'PENDING': 'status-pending',
            'CONFIRMED': 'status-confirmed',
            'IN_PROGRESS': 'status-in-progress',
            'COMPLETED': 'status-completed',
            'CANCELLED': 'status-cancelled'
        };
        return statusMap[status] || 'status-unknown';
    },

    /**
     * Get connection status class
     * REQ-UI-020
     */
    getConnectionStatusClass(status) {
        const statusMap = {
            'connected': 'status-connected',
            'disconnected': 'status-disconnected',
            'connecting': 'status-connecting'
        };
        return statusMap[status] || 'status-unknown';
    },

    /**
     * Parse JSON safely
     * REQ-VAL-008
     */
    parseJSON(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.error('Failed to parse JSON:', e);
            return null;
        }
    },

    /**
     * Validate JSON response
     * REQ-VAL-008
     */
    validateJSONResponse(response) {
        if (!response) return false;
        try {
            JSON.parse(JSON.stringify(response));
            return true;
        } catch (e) {
            return false;
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}

