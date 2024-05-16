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
import { messageToLogFormat } from "./utils/messageToLogFormat";

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
    segmentsRecord[msg.time].lastUpdateStage = stage;

    if (segmentsRecord[msg.time].segments.length === msg.total) {
      segmentsRecord[msg.time].segments.sort((a, b) => a.number - b.number);
      const payloadWithSender = segmentsRecord[msg.time].segments.reduce(
        (acc, message) => acc + message.payload,
        ""
      );

      const [sender, payload] = payloadWithSender.includes(DELIMITER)
        ? payloadWithSender.split(DELIMITER)
        : [null, payloadWithSender];

      const fullMessage: MessageToApplication = {
        sender,
        time: msg.time,
        error: segmentsRecord[msg.time].segments.some((s) => s.error),
        payload,
      };

      console.log("Full message", messageToLogFormat(fullMessage));

      delete segmentsRecord[msg.time];

      applicationAxiosInstance.post("/api/receive", fullMessage);
    }
  },
  (stage: number) => {
    Object.entries(segmentsRecord).forEach(
      ([time, { segments, lastUpdateStage }]) => {
        if (stage - lastUpdateStage >= STAGE_DIFFERENCE_FOR_REMOVAL) {
          const total = segments[0]?.total ?? "(undefined)";
          console.log(
            `Out of ${total} segments,`,
            `${segments.length} received,`,
            `cleaning segments with ${time} time`
          );

          delete segmentsRecord[time];

          const errorMessage: MessageToApplication = {
            sender: null,
            time: Number(time),
            error: true,
            payload: null,
          };

          console.log("Error message", messageToLogFormat(errorMessage));

          applicationAxiosInstance.post("/api/receive", errorMessage);
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
  .listen(3030);
