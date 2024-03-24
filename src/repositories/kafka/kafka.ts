import { Kafka, logLevel } from "kafkajs";

if (!process.env.MESSAGES_KAFKA) {
  throw new Error("MESSAGES_KAFKA is not defined");
}

export const kafka = new Kafka({
  logLevel: logLevel.INFO,
  brokers: [process.env.MESSAGES_KAFKA],
});
