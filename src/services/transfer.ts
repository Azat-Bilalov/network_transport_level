import Elysia from "elysia";
import { MessageProducer, messageProducer } from "../repositories/kafka";
import type { SegmentMessage } from "../types/messages";

export class TransferService {
  private readonly _messageProducer: MessageProducer;

  constructor(messageProducer: MessageProducer) {
    this._messageProducer = messageProducer;
  }

  transfer(segmentMessage: SegmentMessage) {
    const topic = `segment-${segmentMessage.time}`;
    const msg = JSON.stringify(segmentMessage);

    this._messageProducer.send(topic, msg);
  }
}

export const transferService = new Elysia({ name: "transferService" })
  .use(messageProducer)
  .decorate(({ messageProducer }) => ({
    transferService: new TransferService(messageProducer),
  }));
