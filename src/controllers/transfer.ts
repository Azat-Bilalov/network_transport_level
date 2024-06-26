import Elysia from "elysia";
import { segmentMessageFromDatalink } from "../models/messages";
import { transferService } from "../services/transfer";

export const transferController = new Elysia({ name: "transferController" })
  .use(transferService)
  .post(
    "/transfer",
    ({ body, transferService }) => {
      transferService.transfer(body);
      return body;
    },
    {
      body: segmentMessageFromDatalink,
    }
  );
