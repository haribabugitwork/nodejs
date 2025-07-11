const express = require("express");
const amqp = require("amqplib");

const app = express();
app.use(express.json());

const RABBITMQ_URL = "amqp://localhost";

// Function to send messages to RabbitMQ
async function sendToRabbitMQ(exchangeName, exchangeType, routingKey, message) {
  let connection;
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertExchange(exchangeName, exchangeType, { durable: true });
    channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(message)));
    console.log(`[Producer API] Sent to RabbitMQ - Exchange: ${exchangeName}, Routing Key: ${routingKey}, Message: ${JSON.stringify(message)}`);
  } catch (error) {
    console.error("[Producer API] Error sending to RabbitMQ:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

// API endpoint for producing order messages (single consumer scenario)
app.post("/produce/order", async (req, res) => {
  const { orderId, amount } = req.body;
  const order = {
    orderId: orderId || `ORDER_${Date.now()}`,
    amount: amount || parseFloat((Math.random() * 1000).toFixed(2)),
    timestamp: new Date().toISOString(),
    type: "order_created"
  };
  try {
    await sendToRabbitMQ("order_events", "topic", "order.created", order);
    res.status(200).json({ message: "Order message sent successfully", order });
  } catch (error) {
    res.status(500).json({ error: "Failed to send order message", details: error.message });
  }
});

// API endpoint for producing notification messages (multiple consumers scenario)
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
    await sendToRabbitMQ("notification_broadcast", "fanout", "", notification);
    res.status(200).json({ message: "Notification message sent successfully", notification });
  } catch (error) {
    res.status(500).json({ error: "Failed to send notification message", details: error.message });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Producer API is running" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Producer API Service listening on port ${PORT}`);
});

