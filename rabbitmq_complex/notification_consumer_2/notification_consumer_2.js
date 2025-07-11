const amqp = require("amqplib");

async function consumeNotificationMessages() {
  try {
    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    const exchangeName = "notification_broadcast";
    const queueName = ""; // Let RabbitMQ generate a unique queue name for fanout
    
    await channel.assertExchange(exchangeName, "fanout", { durable: true });
    const q = await channel.assertQueue(queueName, { exclusive: true }); // Exclusive queue for this consumer
    await channel.bindQueue(q.queue, exchangeName, ""); // Fanout binding key is empty

    console.log(" [*] Notification Consumer 2 waiting for messages in %s. To exit press CTRL+C", q.queue);

    channel.consume(q.queue, (msg) => {
      if (msg.content) {
        const notification = JSON.parse(msg.content.toString());
        console.log(" [x] Notification Consumer 2 received: %s", notification.message);
        
        // Simulate notification processing (e.g., sending SMS)
        console.log(" [x] Consumer 2 processing notification %s - Sending SMS", notification.id);
        
        // Simulate some processing time
        setTimeout(() => {
          console.log(" [x] Consumer 2 - SMS sent for notification %s!", notification.id);
          // Acknowledge the message
          channel.ack(msg);
        }, 800);
      }
    }, { noAck: false });
  } catch (error) {
    console.error("Error in Notification Consumer 2:", error.message);
    process.exit(1);
  }
}

consumeNotificationMessages();

