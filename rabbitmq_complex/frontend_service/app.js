const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const amqp = require("amqplib");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.static(__dirname + "/public"));

const RABBITMQ_URL = "amqp://localhost";

// Function to send messages to RabbitMQ
async function sendToRabbitMQ(exchangeName, routingKey, message) {
  let connection;
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertExchange(exchangeName, routingKey.includes(".") ? "topic" : "direct", { durable: true });
    channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(message)));
    console.log(`[Frontend Service] Sent to RabbitMQ - Exchange: ${exchangeName}, Routing Key: ${routingKey}, Message: ${JSON.stringify(message)}`);
  } catch (error) {
    console.error("[Frontend Service] Error sending to RabbitMQ:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

// API endpoint for producing order messages
app.post("/produce/order", async (req, res) => {
  const { orderId, amount } = req.body;
  const order = {
    orderId: orderId || `ORDER_${Date.now()}`,
    amount: amount || parseFloat((Math.random() * 1000).toFixed(2)),
    timestamp: new Date().toISOString(),
    type: "order_created"
  };
  try {
    await sendToRabbitMQ("order_events", "order.created", order);
    res.status(200).json({ message: "Order message sent successfully", order });
  } catch (error) {
    res.status(500).json({ error: "Failed to send order message", details: error.message });
  }
});

// API endpoint for producing notification messages (for multiple consumers)
app.post("/produce/notification", async (req, res) => {
  const { message } = req.body;
  const notification = {
    id: `NOTIFICATION_${Date.now()}`,
    message: message || "A new important update!",
    timestamp: new Date().toISOString(),
    type: "notification"
  };
  try {
    // Using a fanout exchange for broadcast to multiple consumers
    await sendToRabbitMQ("notification_broadcast", "", notification);
    res.status(200).json({ message: "Notification message sent successfully", notification });
  } catch (error) {
    res.status(500).json({ error: "Failed to send notification message", details: error.message });
  }
});

// Socket.IO connection for real-time updates to frontend
io.on("connection", (socket) => {
  console.log("A user connected to Socket.IO");

  // Setup RabbitMQ consumer for order messages and emit to frontend
  (async () => {
    let connection;
    try {
      connection = await amqp.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();
      const exchangeName = "order_events";
      const queueName = "frontend_order_queue"; // Unique queue for frontend to receive all order events
      const bindingKey = "order.#";

      await channel.assertExchange(exchangeName, "topic", { durable: true });
      await channel.assertQueue(queueName, { durable: false, autoDelete: true }); // Auto-delete queue for frontend
      await channel.bindQueue(queueName, exchangeName, bindingKey);

      channel.consume(queueName, (msg) => {
        if (msg.content) {
          const content = msg.content.toString();
          console.log(`[Frontend Socket.IO] Received order message: ${content}`);
          socket.emit("order_message", content);
          channel.ack(msg);
        }
      }, { noAck: false });
    } catch (error) {
      console.error("[Frontend Socket.IO] Error setting up order consumer:", error.message);
    } finally {
      // Close connection on disconnect, but keep channel open for consumption
      socket.on("disconnect", async () => {
        console.log("User disconnected from Socket.IO");
        if (connection) {
          // connection.close(); // Do not close connection here, as it closes the channel too
        }
      });
    }
  })();

  // Setup RabbitMQ consumer for notification messages and emit to frontend
  (async () => {
    let connection;
    try {
      connection = await amqp.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();
      const exchangeName = "notification_broadcast";
      const queueName = `frontend_notification_queue_${socket.id}`; // Unique queue per socket for fanout

      await channel.assertExchange(exchangeName, "fanout", { durable: true });
      await channel.assertQueue(queueName, { exclusive: true, autoDelete: true }); // Exclusive and auto-delete for fanout
      await channel.bindQueue(queueName, exchangeName, ""); // Fanout binding key is empty

      channel.consume(queueName, (msg) => {
        if (msg.content) {
          const content = msg.content.toString();
          console.log(`[Frontend Socket.IO] Received notification message: ${content}`);
          socket.emit("notification_message", content);
          channel.ack(msg);
        }
      }, { noAck: false });
    } catch (error) {
      console.error("[Frontend Socket.IO] Error setting up notification consumer:", error.message);
    } finally {
      socket.on("disconnect", async () => {
        if (connection) {
          // connection.close(); // Do not close connection here
        }
      });
    }
  })();
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Frontend Service listening on port ${PORT}`);
});


