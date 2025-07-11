<<<<<<< HEAD
# nodejs
Nodejs projects
=======
# RabbitMQ Microservices Communication Example

This project demonstrates a simple microservices communication pattern using RabbitMQ as a message broker. It consists of two services:

1.  **Producer Service:** Simulates an application that generates order events.
2.  **Consumer Service:** Simulates a backend service that processes these order events asynchronously.

## Project Structure

```
rabbitmq_microservices/
├── producer_service/
│   ├── producer.js
│   └── package.json
└── consumer_service/
    ├── consumer.js
    └── package.json
```

## Prerequisites

Before running this example, ensure you have the following installed:

*   **Node.js:** [Download and Install Node.js](https://nodejs.org/en/download/)
*   **RabbitMQ Server:** You need a running RabbitMQ instance. The easiest way to get this is by using Docker.

    If you have Docker installed, you can run RabbitMQ with the following command:
    ```bash
    docker run -it --rm --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
    ```
    This command will:
    *   `docker run`: Run a Docker container.
    *   `-it`: Run in interactive mode and allocate a pseudo-TTY.
    *   `--rm`: Automatically remove the container when it exits.
    *   `--name rabbitmq`: Assign the name `rabbitmq` to the container.
    *   `-p 5672:5672`: Map port 5672 (AMQP protocol) from the container to your host.
    *   `-p 15672:15672`: Map port 15672 (RabbitMQ Management UI) from the container to your host. You can access the management UI at `http://localhost:15672` with default credentials `guest/guest`.
    *   `rabbitmq:3-management`: Use the RabbitMQ image with the management plugin enabled.

## Setup and Installation

1.  **Clone the repository (or create the files manually as provided):**

    If you received these files as a zip or manually created them, navigate to the `rabbitmq_microservices` directory.

2.  **Install dependencies for Producer Service:**

    Navigate into the `producer_service` directory and install the `amqplib` package:
    ```bash
    cd rabbitmq_microservices/producer_service
    npm install
    ```

3.  **Install dependencies for Consumer Service:**

    Navigate into the `consumer_service` directory and install the `amqplib` package:
    ```bash
    cd rabbitmq_microservices/consumer_service
    npm install
    ```

## How to Run

1.  **Start the RabbitMQ Server:**

    Ensure your RabbitMQ server is running (e.g., via the Docker command provided in the Prerequisites section).

2.  **Start the Consumer Service:**

    Open a new terminal window, navigate to the `consumer_service` directory, and run the consumer:
    ```bash
    cd rabbitmq_microservices/consumer_service
    node consumer.js
    ```
    You should see output indicating that the consumer is waiting for messages:
    `[*] Waiting for messages in order_processing_queue. To exit press CTRL+C`

3.  **Start the Producer Service:**

    Open another new terminal window, navigate to the `producer_service` directory, and run the producer:
    ```bash
    cd rabbitmq_microservices/producer_service
    node producer.js
    ```
    The producer will send a single message and then exit. You should see output similar to:
    `[x] Sent 'order.created':'{"orderId":"ORDER_1678888888888","customerId":"CUSTOMER_123","amount":123.45,"status":"pending"}'`

4.  **Observe the Consumer Output:**

    Switch back to the terminal running the `consumer_service`. You should see the consumer receiving and processing the message sent by the producer:
    ```
    [x] Received order: ORDER_1678888888888
    [x] Processing order ORDER_1678888888888 for customer CUSTOMER_123 with amount 123.45
    ```

## Explanation

This example demonstrates:

*   **Asynchronous Communication:** The producer sends a message and doesn't wait for the consumer to process it. It immediately exits, allowing the web application (simulated by the producer) to remain responsive.
*   **Loose Coupling:** The producer and consumer services are independent. They only need to know about the message format and the RabbitMQ exchange/queue setup, not about each other's internal logic or availability. You can scale them independently.
*   **Topic Exchange:** The producer publishes to a `topic` exchange with a `routingKey` of `order.created`. The consumer binds its queue to this exchange using a `bindingKey` of `order.#`, which means it will receive all messages whose routing keys start with `order.` (e.g., `order.created`, `order.updated`, `order.cancelled`). This allows for flexible routing of different types of order events to various consumers.
*   **Durable Exchange and Queue:** Both the exchange and the queue are declared as `durable: true`. This means they will survive a RabbitMQ broker restart, ensuring that messages are not lost even if the broker goes down.
*   **Manual Acknowledgment:** The consumer uses `noAck: false` and explicitly calls `channel.ack(msg)` after successfully processing a message. This ensures that if the consumer crashes before acknowledging, the message will be redelivered to another available consumer, guaranteeing message processing at least once.

This setup is foundational for building robust and scalable microservices architectures where reliable asynchronous communication is key.

>>>>>>> 2208100 (Initial commit: Push project to nodejs repo)
