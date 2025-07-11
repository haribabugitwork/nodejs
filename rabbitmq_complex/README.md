# RabbitMQ Microservices Communication Example with Frontend

This project demonstrates microservices communication patterns using RabbitMQ as a message broker, featuring both single-consumer and multi-consumer scenarios with a web-based frontend interface.

## Project Overview

The application consists of:

1. **Frontend Service:** A web interface for producing and consuming messages in real-time
2. **Producer Service:** API endpoints for generating different types of messages
3. **Order Consumer Service:** Single consumer for order processing (work queue pattern)
4. **Notification Consumer Services:** Multiple consumers for broadcast notifications (publish-subscribe pattern)

## Project Structure

```
rabbitmq_microservices/
├── frontend_service/
│   ├── app.js
│   ├── public/
│   │   └── index.html
│   └── package.json
├── producer_service/
│   ├── producer.js (original standalone producer)
│   ├── producer_api.js (new API service)
│   └── package.json
├── order_consumer_service/
│   ├── order_consumer.js
│   └── package.json
├── notification_consumer_1/
│   ├── notification_consumer_1.js
│   └── package.json
├── notification_consumer_2/
│   ├── notification_consumer_2.js
│   └── package.json
├── consumer_service/ (original consumer)
│   ├── consumer.js
│   └── package.json
└── README.md
```

## Use Cases Demonstrated

### 1. Single Consumer Pattern (Work Queue)
- **Scenario:** Order processing where each order should be processed by exactly one service
- **Exchange Type:** Topic Exchange
- **Routing Key:** `order.created`
- **Queue:** `order_processing_queue` (durable, shared queue)
- **Consumer:** Order Consumer Service
- **Behavior:** Messages are distributed among available consumers in a round-robin fashion

### 2. Multiple Consumer Pattern (Publish-Subscribe)
- **Scenario:** Notification broadcasting where each notification should be processed by all interested services
- **Exchange Type:** Fanout Exchange
- **Routing Key:** Empty (ignored in fanout)
- **Queues:** Exclusive queues for each consumer
- **Consumers:** Notification Consumer 1 (Email Service), Notification Consumer 2 (SMS Service)
- **Behavior:** Each message is delivered to all consumers

## Prerequisites

Before running this example, ensure you have the following installed:

*   **Node.js:** [Download and Install Node.js](https://nodejs.org/en/download/)
*   **RabbitMQ Server:** You need a running RabbitMQ instance.

### Installing RabbitMQ with Docker

The easiest way to get RabbitMQ running is with Docker:

```bash
docker run -it --rm --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

This command will:
- Run RabbitMQ with management plugin enabled
- Map port 5672 (AMQP protocol) for message broker communication
- Map port 15672 (Management UI) accessible at `http://localhost:15672` (guest/guest)

### Alternative: Installing RabbitMQ Locally

For production or development environments, you can install RabbitMQ directly:

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install rabbitmq-server
sudo systemctl start rabbitmq-server
sudo systemctl enable rabbitmq-server
```

**macOS (with Homebrew):**
```bash
brew install rabbitmq
brew services start rabbitmq
```

**Windows:**
Download and install from [RabbitMQ official website](https://www.rabbitmq.com/download.html)

## Setup and Installation

1. **Navigate to the project directory:**
   ```bash
   cd rabbitmq_microservices
   ```

2. **Install dependencies for all services:**

   **Frontend Service:**
   ```bash
   cd frontend_service
   npm install
   cd ..
   ```

   **Producer Service:**
   ```bash
   cd producer_service
   npm install
   cd ..
   ```

   **Order Consumer Service:**
   ```bash
   cd order_consumer_service
   npm install
   cd ..
   ```

   **Notification Consumer 1:**
   ```bash
   cd notification_consumer_1
   npm install
   cd ..
   ```

   **Notification Consumer 2:**
   ```bash
   cd notification_consumer_2
   npm install
   cd ..
   ```

## How to Run

### Step 1: Start RabbitMQ Server

Ensure your RabbitMQ server is running (via Docker command above or local installation).

### Step 2: Start Consumer Services

Open separate terminal windows for each consumer service:

**Terminal 1 - Order Consumer:**
```bash
cd rabbitmq_microservices/order_consumer_service
node order_consumer.js
```

**Terminal 2 - Notification Consumer 1:**
```bash
cd rabbitmq_microservices/notification_consumer_1
node notification_consumer_1.js
```

**Terminal 3 - Notification Consumer 2:**
```bash
cd rabbitmq_microservices/notification_consumer_2
node notification_consumer_2.js
```

### Step 3: Start Producer API Service (Optional)

If you want to use the standalone producer API:

**Terminal 4 - Producer API:**
```bash
cd rabbitmq_microservices/producer_service
node producer_api.js
```

### Step 4: Start Frontend Service

**Terminal 5 - Frontend Service:**
```bash
cd rabbitmq_microservices/frontend_service
node app.js
```

### Step 5: Access the Web Interface

Open your web browser and navigate to:
```
http://localhost:3000
```

## Using the Application

### Web Interface Features

1. **Order Production (Single Consumer):**
   - Enter an Order ID (optional) and Amount
   - Click "Send Order (Single Consumer)"
   - Watch the order being processed by the Order Consumer Service
   - Only one consumer will process each order

2. **Notification Production (Multiple Consumers):**
   - Click "Send Notification (Multiple Consumers)"
   - Watch the notification being processed by both Notification Consumer services
   - Each consumer will receive and process the same notification

3. **Real-time Updates:**
   - The web interface shows real-time updates from all consumer services
   - Messages appear in separate sections for order processing and notifications

### API Endpoints

If using the standalone producer API service:

**Send Order:**
```bash
curl -X POST http://localhost:3001/produce/order \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORDER_123", "amount": 99.99}'
```

**Send Notification:**
```bash
curl -X POST http://localhost:3001/produce/notification \
  -H "Content-Type: application/json" \
  -d '{"message": "Important system update available!"}'
```

**Health Check:**
```bash
curl http://localhost:3001/health
```

## Architecture Explanation

### Single Consumer Pattern (Work Queue)

```
Frontend/Producer → Topic Exchange (order_events) → order_processing_queue → Order Consumer
                    Routing Key: order.created
```

- **Use Case:** Order processing, payment processing, file processing
- **Characteristics:**
  - Each message is consumed by exactly one consumer
  - Load balancing across multiple consumer instances
  - Reliable processing with acknowledgments
  - Durable queue ensures messages survive broker restarts

### Multiple Consumer Pattern (Publish-Subscribe)

```
Frontend/Producer → Fanout Exchange (notification_broadcast) → Queue 1 → Consumer 1 (Email)
                                                              → Queue 2 → Consumer 2 (SMS)
```

- **Use Case:** Notifications, logging, analytics, event broadcasting
- **Characteristics:**
  - Each message is delivered to all subscribed consumers
  - Independent processing by each consumer
  - Exclusive queues for each consumer
  - Automatic queue cleanup when consumers disconnect

### Frontend Integration

The frontend service acts as both:
1. **Producer:** Sends messages to RabbitMQ via REST API endpoints
2. **Consumer:** Receives messages from RabbitMQ and forwards them to the web interface via Socket.IO

This creates a real-time feedback loop where users can see the immediate effects of their actions.

## Key Concepts Demonstrated

### 1. Exchange Types
- **Topic Exchange:** Flexible routing based on routing key patterns
- **Fanout Exchange:** Broadcast messages to all bound queues

### 2. Queue Properties
- **Durable Queues:** Survive broker restarts (order processing)
- **Exclusive Queues:** Private to a single consumer connection (notifications)
- **Auto-delete Queues:** Automatically removed when no longer needed

### 3. Message Acknowledgment
- **Manual Acknowledgment:** Ensures reliable message processing
- **At-least-once Delivery:** Messages are redelivered if not acknowledged

### 4. Loose Coupling
- Services communicate only through message contracts
- Independent scaling and deployment
- Fault tolerance through message persistence

## Troubleshooting

### Common Issues

1. **RabbitMQ Connection Refused:**
   - Ensure RabbitMQ server is running
   - Check if port 5672 is accessible
   - Verify Docker container is running (if using Docker)

2. **Messages Not Appearing in Frontend:**
   - Check browser console for JavaScript errors
   - Ensure all consumer services are running
   - Verify Socket.IO connection in browser developer tools

3. **Consumer Services Not Receiving Messages:**
   - Check RabbitMQ Management UI (http://localhost:15672)
   - Verify exchange and queue bindings
   - Check consumer service logs for connection errors

4. **Port Conflicts:**
   - Frontend Service: Port 3000
   - Producer API Service: Port 3001
   - Change ports in respective app.js files if needed

### Monitoring

Use the RabbitMQ Management UI to monitor:
- Exchange message rates
- Queue depths and consumer counts
- Connection status
- Message acknowledgment rates

Access the management interface at `http://localhost:15672` with credentials `guest/guest`.

## Extending the Application

### Adding New Consumer Types

1. Create a new directory for your consumer service
2. Install amqplib: `npm install amqplib`
3. Create a consumer script following the existing patterns
4. Bind to appropriate exchanges based on your use case

### Adding New Message Types

1. Add new API endpoints in the producer service
2. Create appropriate exchanges and routing keys
3. Update frontend interface to support new message types
4. Implement corresponding consumer logic

### Scaling Considerations

- **Horizontal Scaling:** Run multiple instances of consumer services
- **Load Balancing:** Use work queues for distributing load
- **High Availability:** Use RabbitMQ clustering for production
- **Monitoring:** Implement health checks and metrics collection

This example provides a solid foundation for building robust, scalable microservices architectures with reliable asynchronous communication patterns.

