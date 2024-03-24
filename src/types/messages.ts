export type MessageFromApplication = {
  sender: string;
  time: number;
  payload: string;
};

export type MessageToApplication = {
  sender: string;
  time: number;
  error: boolean;
  payload: string;
};

export type SegmentMessage = {
  time: number;
  payload: string;
  total: number;
  number: number;
};
