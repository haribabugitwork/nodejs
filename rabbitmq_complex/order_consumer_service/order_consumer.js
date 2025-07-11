const amqp = require("amqplib");

async function consumeOrderMessages() {
  try {
    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    const exchangeName = "order_events";
    const queueName = "order_processing_queue"; // Single queue for order processing
    const bindingKey = "order.#"; // Listen for all messages starting with 'order.'

    await channel.assertExchange(exchangeName, "topic", { durable: true });
    await channel.assertQueue(queueName, { durable: true });
    await channel.bindQueue(queueName, exchangeName, bindingKey);

    console.log(" [*] Order Consumer Service waiting for messages in %s. To exit press CTRL+C", queueName);

    channel.consume(queueName, (msg) => {
      if (msg.content) {
        const order = JSON.parse(msg.content.toString());
        console.log(" [x] Order Consumer received order: %s", order.orderId);
        
        // Simulate order processing
        console.log(" [x] Processing order %s with amount $%s", order.orderId, order.amount);
        
        // Simulate some processing time
        setTimeout(() => {
          console.log(" [x] Order %s processing completed!", order.orderId);
          // Acknowledge the message to remove it from the queue
          channel.ack(msg);
        }, 1000);
      }
    }, { noAck: false }); // Use manual acknowledgment for reliability
  } catch (error) {
    console.error("Error in Order Consumer:", error.message);
    process.exit(1);
  }
}

consumeOrderMessages();

