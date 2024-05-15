import type { SegmentMessageFromDatalink } from "./messages";

export type StateSegments = {
  segments: SegmentMessageFromDatalink[];
  lastUpdateStage: number;
};

export type SegmentsRecord = Record<string, StateSegments>;
