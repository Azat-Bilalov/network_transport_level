import type { AxiosInstance } from "axios";
import Elysia from "elysia";
import { axiosInstance } from "../repositories/axios";
import type {
  MessageFromApplication,
  SegmentMessageToDatalink,
} from "../types/messages";
import { messageToLogFormat } from "../utils/messageToLogFormat";

const SEGMENT_HEADER_SIZE = 8 + 8 + 8;
const SEGMENT_SIZE = 2300;
const SEGMENT_PAYLOAD_SIZE = SEGMENT_SIZE - SEGMENT_HEADER_SIZE;

export class SenderService {
  private readonly _axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this._axiosInstance = axiosInstance;
  }

  async splitAndSend(message: MessageFromApplication) {
    const segments = this._split(message);

    try {
      for (const segment of segments) {
        await this._send(segment);
      }
    } catch (error) {
      console.error("Failed to send message", error);
    }
  }

  private async _send(data: SegmentMessageToDatalink) {
    console.log(
      "[senderService] Sending to datalink level:",
      messageToLogFormat(data)
    );
    return this._axiosInstance.post("/code", data);
  }

  private _split(message: MessageFromApplication): SegmentMessageToDatalink[] {
    const segments: SegmentMessageToDatalink[] = [];
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const encodedPayload = encoder.encode(message.payload);
    const total = Math.floor(encodedPayload.length / SEGMENT_PAYLOAD_SIZE) + 1;

    const currentEncodedPayload: number[] = [];

    const encodedSender = encoder.encode(message.sender);
    currentEncodedPayload.push(...encodedSender, "\0".charCodeAt(0));

    encodedPayload.forEach((byte) => {
      currentEncodedPayload.push(byte);

      if (currentEncodedPayload.length === SEGMENT_PAYLOAD_SIZE) {
        const uint8Array = new Uint8Array(currentEncodedPayload);

        const segmentMessage: SegmentMessageToDatalink = {
          time: message.time,
          payload: decoder.decode(uint8Array),
          total,
          number: segments.length + 1,
        };

        segments.push(segmentMessage);

        currentEncodedPayload.length = 0;
      }
    });

    const uint8Array = new Uint8Array(currentEncodedPayload);

    const segmentMessage: SegmentMessageToDatalink = {
      time: message.time,
      payload: decoder.decode(uint8Array),
      total,
      number: segments.length + 1,
    };

    segments.push(segmentMessage);

    return segments;
  }
}

export const senderService = new Elysia({ name: "senderService" })
  .use(axiosInstance)
  .decorate(({ datalinkAxiosInstance }) => ({
    senderService: new SenderService(datalinkAxiosInstance),
  }));
