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

    console.log(" [*] Notification Consumer 1 waiting for messages in %s. To exit press CTRL+C", q.queue);

    channel.consume(q.queue, (msg) => {
      if (msg.content) {
        const notification = JSON.parse(msg.content.toString());
        console.log(" [x] Notification Consumer 1 received: %s", notification.message);
        
        // Simulate notification processing (e.g., sending email)
        console.log(" [x] Consumer 1 processing notification %s - Sending Email", notification.id);
        
        // Simulate some processing time
        setTimeout(() => {
          console.log(" [x] Consumer 1 - Email sent for notification %s!", notification.id);
          // Acknowledge the message
          channel.ack(msg);
        }, 500);
      }
    }, { noAck: false });
  } catch (error) {
    console.error("Error in Notification Consumer 1:", error.message);
    process.exit(1);
  }
}

consumeNotificationMessages();

