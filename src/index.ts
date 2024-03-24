import { Elysia } from "elysia";
import { sendController } from "./controllers/send";
import { transferController } from "./controllers/transfer";
import { MessageConsumer, messageProducer } from "./repositories/kafka";
import dotenv from "dotenv";
import type { MessageToApplication, SegmentMessage } from "./types/messages";
import { applicationAxiosInstance } from "./repositories/axios";

dotenv.config();

if (!process.env.MESSAGES_KAFKA_CONSUMER_TOPIC) {
  throw new Error("MESSAGES_KAFKA_CONSUMER_TOPIC is not defined");
}

const TIMEOUT = 5000;
const messages: SegmentMessage[] = [];

const messageConsumer = new MessageConsumer(
  process.env.MESSAGES_KAFKA_CONSUMER_TOPIC,
  (msg: SegmentMessage) => {
    messages.push(msg);

    // сортируем группируем сообщения в объекты по времени
    const groupedMessages = messages.reduce((acc, message) => {
      if (!acc[message.time]) {
        acc[message.time] = [];
      }

      acc[message.time].push(message);

      return acc;
    }, {} as Record<string, SegmentMessage[]>);

    Object.entries(groupedMessages).forEach(([time, messages]) => {
      if (messages.length && messages.length === messages[0].total) {
        messages.sort((a, b) => a.number - b.number);
        const payload = messages.reduce(
          (acc, message) => acc + message.payload,
          ""
        );

        const fullMessage: MessageToApplication = {
          sender: "transfer", // @todo: уточнить у заказчика
          time: Number(time),
          error: false,
          payload,
        };

        console.log("Full message", fullMessage);

        // отправляем сообщение в приложение
        applicationAxiosInstance.post("/receive", fullMessage);
      }
    });
  },
  TIMEOUT
);

messageConsumer.runWithDelay();

new Elysia().use(sendController).use(transferController).listen(3000);
