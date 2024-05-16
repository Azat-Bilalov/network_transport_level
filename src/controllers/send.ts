import Elysia from "elysia";
import { messageFromApplication } from "../models/messages";
import { senderService } from "../services/send";

export const sendController = new Elysia({ name: "sendController" })
  .use(senderService)
  .post(
    "/send",
    ({ body, senderService }) => {
      senderService.splitAndSend(body);
      return body;
    },
    {
      body: messageFromApplication,
    }
  );
