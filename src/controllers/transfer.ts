import Elysia from "elysia";
import { segmentMessageFromDatalink } from "../models/messages";
import { transferService } from "../services/transfer";

export const transferController = new Elysia({ name: "transferController" })
  .use(transferService)
  .post(
    "/transfer",
    ({ body, transferService }) => {
      transferService.transfer(body);
      console.log("запрос на трансфер");
      return body;
    },
    {
      body: segmentMessageFromDatalink,
    }
  );
