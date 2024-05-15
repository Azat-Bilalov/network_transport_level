import { t } from "elysia";

export const messageFromApplication = t.Object({
  sender: t.String({ minLength: 1, maxLength: 100 }),
  time: t.Integer(),
  payload: t.String(),
});

export const messageToApplication = t.Object({
  sender: t.String({ minLength: 1, maxLength: 100 }),
  time: t.Integer(),
  error: t.Boolean(),
  payload: t.String(),
});

export const segmentMessageFromDatalink = t.Object({
  payload: t.String(),
  time: t.Integer(),
  total: t.Integer(),
  number: t.Integer(),
  error: t.Boolean(),
});
