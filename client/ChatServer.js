const WebSocket = require('ws');

// Create a WebSocket server
const server = new WebSocket.Server({ port: 8080 });
console.debug("WebSocket server running on ws://localhost:8080");

// Map to keep track of clients by channel ID
const channels = new Map();

// Handle new client connections
server.on('connection', (socket) => {
    let channelId = null;

    // Handle messages from the client
    socket.on('message', (data) => {
        try {
            const message = JSON.parse(data);

            // When a client connects to a channel
            if (message.type === 'connect' && message.channelId) {
                channelId = message.channelId;

                // Add the client to the specified channel
                if (!channels.has(channelId)) {
                    channels.set(channelId, new Set());
                }
                channels.get(channelId).add(socket);
                console.debug(`Client connected to channel: ${channelId}`);

                // Notify the client of a successful connection
                socket.send(JSON.stringify({ type: 'info', message: `Connected to channel: ${channelId}` }));
                return;
            }

            // Forward messages to all clients in the same channel
            if (message.type === 'message' && message.text && channelId) {
                console.debug(`Message in channel ${channelId}: ${message.text}`);
                const clientsInChannel = channels.get(channelId);

                if (clientsInChannel) {
                    for (const client of clientsInChannel) {
                        if (client !== socket && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: 'message', text: message.text }));
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error processing message: ", error);
            socket.send(JSON.stringify({ type: 'error', message: 'Invalid message format.' }));
        }
    });

    // Handle client disconnection
    socket.on('close', () => {
        if (channelId) {
            const clientsInChannel = channels.get(channelId);
            if (clientsInChannel) {
                clientsInChannel.delete(socket);
                console.debug(`Client disconnected from channel: ${channelId}`);

                // Remove the channel if no clients remain
                if (clientsInChannel.size === 0) {
                    channels.delete(channelId);
                }
            }
        }
    });

    // Handle errors
    socket.on('error', (error) => {
        console.error("WebSocket error: ", error);
    });
});
