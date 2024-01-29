const amqplib = require('amqplib');

let channel, connection;

async function connectQueue() {
    try {
        // Update the connection URL to use the RabbitMQ container name
        connection = await amqplib.connect("amqp://rabbitmq-5");
        channel = await connection.createChannel();
        await channel.assertQueue("noti-queue");
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function sendData(data) {
    try {
        await channel.sendToQueue("noti-queue", Buffer.from(JSON.stringify(data)));
    } catch (error) {
        console.log(error);
        throw error;
    }
}

module.exports = {
    connectQueue,
    sendData
};
