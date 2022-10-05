require('dotenv').config();

const amqp = require('amqplib/callback_api');

const queue = process.env.QUEUE_NAME;
const amqpUrl = process.env.AMQP_URL || 'amqp://localhost';

function main() {
    amqp.connect(amqpUrl, function(error0, connection) {
        if (error0) {
            throw error0;
        }
        connection.createChannel(function(error1, channel) {
            if (error1) {
                throw error1;
            }

            channel.assertQueue(queue, {
                durable: false
            });

            setInterval(() => {
                const msg = "Sending message at " + Date.now();
                channel.sendToQueue(queue, Buffer.from(msg));
                console.log(" [x] Sent %s", msg);
            }, 1000);
        });
    });
}

main();
