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

    console.log(
      `[producer] Topic: ${topic}, message:`,
      message.slice(0, 10) + "..."
    );

    await this.producer.disconnect();
  }
}

export const messageProducer = new Elysia({ name: "messageProducer" }).decorate(
  "messageProducer",
  new MessageProducer()
);
