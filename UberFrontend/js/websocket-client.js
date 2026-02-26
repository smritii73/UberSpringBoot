/**
 * WebSocket Client using SockJS and STOMP
 * REQ-WS-001 through REQ-WS-019
 */

const WebSocketClient = {
    socket: null,
    stompClient: null,
    isConnected: false,
    reconnectAttempts: 0,
    reconnectTimer: null,
    subscriptions: {},

    /**
     * Initialize WebSocket connection
     * REQ-WS-001, REQ-WS-002, REQ-WS-003
     */
    connect(onConnect, onDisconnect, onError) {
        const url = `${AppConfig.websocket.baseUrl}${AppConfig.websocket.endpoint}`;
        
        console.log('Connecting to WebSocket:', url);
        
        // Create SockJS connection
        this.socket = new SockJS(url);
        
        // Create STOMP client over SockJS
        this.stompClient = Stomp.over(this.socket);
        
        // Disable debug logging (set to true for debugging)
        this.stompClient.debug = null;

        // Connect to STOMP broker
        this.stompClient.connect(
            {},
            (frame) => {
                console.log('WebSocket connected:', frame);
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                if (onConnect) {
                    onConnect(frame);
                }
            },
            (error) => {
                console.error('WebSocket connection error:', error);
                this.isConnected = false;
                
                if (onError) {
                    onError(error);
                }
                
                // Attempt reconnection
                this.attemptReconnect(onConnect, onDisconnect, onError);
            }
        );

        // Handle socket close
        this.socket.onclose = () => {
            console.log('WebSocket closed');
            this.isConnected = false;
            
            if (onDisconnect) {
                onDisconnect();
            }
            
            // Attempt reconnection
            this.attemptReconnect(onConnect, onDisconnect, onError);
        };
    },

    /**
     * Attempt reconnection with exponential backoff
     * REQ-WS-004, REQ-WS-005, REQ-WS-006
     */
    attemptReconnect(onConnect, onDisconnect, onError) {
        if (this.reconnectAttempts >= AppConfig.websocket.reconnectAttempts) {
            console.error('Max reconnection attempts reached');
            Utils.showError('Failed to connect to server. Please refresh the page.');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(
            AppConfig.websocket.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
            AppConfig.websocket.reconnectMaxDelay
        );

        console.log(`Attempting reconnection ${this.reconnectAttempts}/${AppConfig.websocket.reconnectAttempts} in ${delay}ms`);

        this.reconnectTimer = setTimeout(() => {
            this.connect(onConnect, onDisconnect, onError);
        }, delay);
    },

    /**
     * Subscribe to a topic
     * REQ-WS-007, REQ-WS-008, REQ-WS-009
     */
    subscribe(topic, callback) {
        if (!this.isConnected || !this.stompClient) {
            console.error('Cannot subscribe: WebSocket not connected');
            return null;
        }

        try {
            const subscription = this.stompClient.subscribe(topic, (message) => {
                try {
                    const data = Utils.parseJSON(message.body);
                    if (data) {
                        callback(data);
                    } else {
                        console.error('Failed to parse message:', message.body);
                        Utils.showError('Received invalid message format');
                    }
                } catch (error) {
                    console.error('Error processing message:', error);
                    Utils.showError('Error processing message');
                }
            });

            this.subscriptions[topic] = subscription;
            console.log('Subscribed to topic:', topic);
            return subscription;
        } catch (error) {
            console.error('Error subscribing to topic:', error);
            Utils.showError('Failed to subscribe to notifications');
            return null;
        }
    },

    /**
     * Unsubscribe from a topic
     * REQ-WS-010
     */
    unsubscribe(topic) {
        if (this.subscriptions[topic]) {
            this.subscriptions[topic].unsubscribe();
            delete this.subscriptions[topic];
            console.log('Unsubscribed from topic:', topic);
        }
    },

    /**
     * Send message to server
     * REQ-WS-011, REQ-WS-012, REQ-WS-013, REQ-WS-014
     */
    send(destination, message) {
        if (!this.isConnected || !this.stompClient) {
            console.error('Cannot send: WebSocket not connected');
            Utils.showError('Not connected to server');
            return false;
        }

        try {
            // Validate message payload
            if (!message || typeof message !== 'object') {
                throw new Error('Invalid message payload');
            }

            const destinationPath = `${AppConfig.websocket.appPrefix}${destination}`;
            this.stompClient.send(destinationPath, {}, JSON.stringify(message));
            console.log('Message sent to:', destinationPath, message);
            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            Utils.showError('Failed to send message');
            return false;
        }
    },

    /**
     * Disconnect WebSocket
     */
    disconnect() {
        // Unsubscribe from all topics
        Object.keys(this.subscriptions).forEach(topic => {
            this.unsubscribe(topic);
        });

        // Clear reconnection timer
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        // Disconnect STOMP client
        if (this.stompClient) {
            this.stompClient.disconnect(() => {
                console.log('STOMP client disconnected');
            });
            this.stompClient = null;
        }

        // Close socket
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }

        this.isConnected = false;
        this.reconnectAttempts = 0;
    },

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return this.isConnected ? 'connected' : 'disconnected';
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSocketClient;
}

