import Elysia from "elysia";
import { MessageProducer, messageProducer } from "../repositories/kafka";
import type { SegmentMessageFromDatalink } from "../types/messages";

if (!process.env.MESSAGES_KAFKA_TOPIC) {
  throw new Error("MESSAGES_KAFKA_TOPIC is not defined");
}

export class TransferService {
  private readonly _messageProducer: MessageProducer;

  constructor(messageProducer: MessageProducer) {
    this._messageProducer = messageProducer;
  }

  transfer(segmentMessage: SegmentMessageFromDatalink) {
    const topic = process.env.MESSAGES_KAFKA_TOPIC || "draw-chat";
    const msg = JSON.stringify(segmentMessage);

    this._messageProducer.send(topic, msg);
  }
}

export const transferService = new Elysia({ name: "transferService" })
  .use(messageProducer)
  .decorate(({ messageProducer }) => ({
    transferService: new TransferService(messageProducer),
  }));
