import { Elysia } from "elysia";
import { sendController } from "./controllers/send";
import { transferController } from "./controllers/transfer";
import { MessageConsumer, messageProducer } from "./repositories/kafka";
import dotenv from "dotenv";
import type {
  MessageToApplication,
  SegmentMessageFromDatalink,
} from "./types/messages";
import { applicationAxiosInstance } from "./repositories/axios";
import { swagger } from "@elysiajs/swagger";
import type { SegmentsRecord } from "./types/messageRecord";

dotenv.config();

if (!process.env.MESSAGES_KAFKA_TOPIC) {
  throw new Error("MESSAGES_KAFKA_TOPIC is not defined");
}

const TIMEOUT = 2000;
const STAGE_DIFFERENCE_FOR_REMOVAL = 3;
const DELIMITER = "\0";

const segmentsRecord: SegmentsRecord = {};

const messageConsumer = new MessageConsumer(
  process.env.MESSAGES_KAFKA_TOPIC,
  (msg: SegmentMessageFromDatalink, stage: number) => {
    if (!segmentsRecord[msg.time]) {
      segmentsRecord[msg.time] = {
        lastUpdateStage: stage,
        segments: [],
      };
    }

    segmentsRecord[msg.time].segments.push(msg);

    Object.entries(segmentsRecord).forEach(
      ([time, { segments, lastUpdateStage }]) => {
        if (segments.length && segments.length === segments[0].total) {
          segments.sort((a, b) => a.number - b.number);
          const payloadWithSender = segments.reduce(
            (acc, message) => acc + message.payload,
            ""
          );

          delete segmentsRecord[time];

          const [sender, payload] = payloadWithSender.includes(DELIMITER)
            ? payloadWithSender.split(DELIMITER)
            : [null, payloadWithSender];

          const fullMessage: MessageToApplication = {
            sender,
            time: Number(time),
            error: segments.some((s) => s.error),
            payload,
          };

          console.log("Full message", fullMessage);

          // applicationAxiosInstance.post("/api/receive", fullMessage);

          return;
        }

        if (stage - lastUpdateStage >= STAGE_DIFFERENCE_FOR_REMOVAL) {
          const total = segments[0]?.total ?? "(undefined)";
          console.log(
            `Out of ${total} segments,`,
            `${segments.length} received,`,
            `cleaning segments with ${time}`
          );

          delete segmentsRecord[time];

          const errorMessage: MessageToApplication = {
            sender: null,
            time: Number(time),
            error: true,
            payload: null,
          };

          console.log("Error message", errorMessage);

          // applicationAxiosInstance.post("/api/receive", errorMessage);
        }
      }
    );
  },
  TIMEOUT
);

messageConsumer.runWithDelay();

new Elysia()
  .use(swagger())
  .use(sendController)
  .use(transferController)
  .listen(3000);
