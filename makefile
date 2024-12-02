# Variables
CLIENT_DIR = client
SERVER_SCRIPT = $(CLIENT_DIR)/ChatServer.js

.PHONY: start server client tests coverage gas_reporter run_two_clients clean

# Start the client and server simultaneously
start:
	@echo "Starting the client and chat server..."
	@make -j2 client server

# Start the client
client:
	@echo "Starting the client..."
	cd $(CLIENT_DIR) && npm start

# Start the chat server
server:
	@echo "Starting the chat server..."
	node $(SERVER_SCRIPT)

# Run tests
tests:
	@echo "Running tests..."
	npx hardhat test

# Generate coverage
coverage:
	@echo "Generating test coverage..."
	npx hardhat coverage

# Run gas reporter
gas_reporter:
	@echo "Running gas reporter..."
	REPORT_GAS=TRUE npx hardhat test

# Run two instances of the client with the server
run_two_clients:
	@echo "Starting two client instances and the chat server..."
	@make server &
	@cd $(CLIENT_DIR) && npm start &
	@cd $(CLIENT_DIR) && npm start

# Clean up background jobs
clean:
	@echo "Stopping all background jobs..."
	-pkill -f "npm start"
	-pkill -f "node $(SERVER_SCRIPT)"
