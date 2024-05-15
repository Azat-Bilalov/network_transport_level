import { Partitioners, type Producer } from "kafkajs";
import { kafka } from "./kafka";
import Elysia from "elysia";

export class MessageProducer {
  readonly producer: Producer;

  constructor() {
    this.producer = kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner,
    });
  }

  async send(topic: string, message: string) {
    await this.producer.connect();

    await this.producer.send({
      topic,
      messages: [{ value: message }],
    });

    console.log(`[producer] Sent message: ${message} to topic: ${topic}`);

    await this.producer.disconnect();
  }
}

export const messageProducer = new Elysia({ name: "messageProducer" }).decorate(
  "messageProducer",
  new MessageProducer()
);
