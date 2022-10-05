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

            console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

            channel.consume(queue, function(msg) {
                console.log(" [x] Received %s", msg.content.toString());
            }, {
                noAck: true
            });
        });
    });
}

main();
