const amqp = require("amqplib");

async function consumeMessages() {
  try {
    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    const exchangeName = "order_events";
    const queueName = "order_processing_queue";
    const bindingKey = "order.#"; // Listen for all messages starting with 'order.'

    await channel.assertExchange(exchangeName, "topic", { durable: true });
    await channel.assertQueue(queueName, { durable: true });
    await channel.bindQueue(queueName, exchangeName, bindingKey);

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queueName);

    channel.consume(queueName, (msg) => {
      if (msg.content) {
        const order = JSON.parse(msg.content.toString());
        console.log(" [x] Received order: %s", order.orderId);
        // Simulate processing the order
        console.log(" [x] Processing order %s for customer %s with amount %s", order.orderId, order.customerId, order.amount);
        // Acknowledge the message to remove it from the queue
        channel.ack(msg);
      }
    }, { noAck: false }); // Use manual acknowledgment
  } catch (error) {
    console.error("Error in consumer:", error.message);
    process.exit(1);
  }
}

consumeMessages();


