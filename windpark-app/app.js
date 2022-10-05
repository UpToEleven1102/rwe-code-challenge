require('dotenv').config();

const amqp = require('amqplib/callback_api');
const WindParkApiService = require("./services/wind-park-api");

const queue = process.env.QUEUE_NAME;
const amqpUrl = process.env.AMQP_URL || 'amqp://localhost';

function main() {
    // initialize service to frequently fetch data from API
    console.log('Init Wind park service...')
    const windParkService = new WindParkApiService();
    windParkService.init();
    console.log('Initialized wind park service...');


    // connect to rabbitMQ to send data to the queue
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
                const data = windParkService.getAggregateValues()
                data.sent_at = Date.now();
                const msg = JSON.stringify(data);
                channel.sendToQueue(queue, Buffer.from(msg));

                console.log(" [x] Sent %s", msg);
            }, 5000);
        });
    });
}

main();
