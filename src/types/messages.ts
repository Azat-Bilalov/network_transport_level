export type MessageFromApplication = {
  sender: string;
  time: number;
  payload: string;
};

export type MessageToApplication = {
  sender: string | null;
  time: number;
  error: boolean;
  payload: string | null;
};

export type SegmentMessageToDatalink = {
  time: number;
  payload: string;
  total: number;
  number: number;
};

export type SegmentMessageFromDatalink = {
  time: number;
  payload: string;
  total: number;
  number: number;
  error: boolean;
};
