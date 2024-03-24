import type { AxiosInstance } from "axios";
import Elysia from "elysia";
import { axiosInstance } from "../repositories/axios";
import type { MessageFromApplication, SegmentMessage } from "../types/messages";

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

  private async _send(data: SegmentMessage) {
    return this._axiosInstance.post("/send", data);
  }

  private _split(message: MessageFromApplication): SegmentMessage[] {
    const segments: SegmentMessage[] = [];
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const encodedPayload = encoder.encode(message.payload);
    const total = encodedPayload.length / SEGMENT_PAYLOAD_SIZE;

    const currentEncodedPayload: number[] = [];

    encodedPayload.forEach((byte, index) => {
      currentEncodedPayload.push(byte);

      if (currentEncodedPayload.length === SEGMENT_PAYLOAD_SIZE) {
        const uint8Array = new Uint8Array(currentEncodedPayload);

        const segmentMessage: SegmentMessage = {
          time: message.time,
          payload: decoder.decode(uint8Array),
          total,
          number: segments.length + 1,
        };

        segments.push(segmentMessage);

        currentEncodedPayload.length = 0;
      }
    });

    return segments;
  }
}

export const senderService = new Elysia({ name: "senderService" })
  .use(axiosInstance)
  .decorate(({ datalinkAxiosInstance }) => ({
    senderService: new SenderService(datalinkAxiosInstance),
  }));
