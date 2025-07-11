const amqp = require('amqplib');

async function sendOrder() {
  try {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    const exchangeName = 'order_events';
    const routingKey = 'order.created';
    const order = {
      orderId: `ORDER_${Date.now()}`,
      customerId: `CUSTOMER_${Math.floor(Math.random() * 1000)}`,
      amount: parseFloat((Math.random() * 1000).toFixed(2)),
      status: 'pending'
    };
    const msg = JSON.stringify(order);

    await channel.assertExchange(exchangeName, 'topic', { durable: true });
    channel.publish(exchangeName, routingKey, Buffer.from(msg));

    console.log(`[x] Sent '${routingKey}':'${msg}'`);

    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 500);
  } catch (error) {
    console.error('Error in producer:', error.message);
    process.exit(1);
  }
}

sendOrder();


