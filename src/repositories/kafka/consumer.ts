import type { Consumer } from "kafkajs";
import { kafka } from "./kafka";

export class MessageConsumer<V> {
  readonly consumer: Consumer;
  private readonly _callback: (msg: V, stage: number) => void;
  private readonly _delay: number;
  private readonly _topic: string;
  private _isRunning: boolean = false;
  private _stage: number = 0;

  constructor(
    topic: string,
    callback: (msg: V, stage: number) => void,
    delay: number
  ) {
    if (!topic) {
      throw new Error(`${topic} is not defined`);
    }

    const groupId = Date.now().toString();

    this.consumer = kafka.consumer({ groupId });
    this._callback = callback;
    this._delay = delay;
    this._topic = topic;
  }

  private async _connectAndRun() {
    await this.consumer.connect();

    await this.consumer.subscribe({
      topic: this._topic,
      fromBeginning: false,
    });

    await this.consumer.run({
      eachBatch: async ({ batch, pause }) => {
        console.log(
          "[consumer] Received message:",
          batch.topic,
          batch.partition,
          batch.messages.map((m) => m.value?.toString())
        );

        batch.messages.forEach((message) => {
          if (!message.value) {
            return;
          }

          const msg = JSON.parse(message.value.toString()) as V;

          this._callback(msg, this._stage);
        });

        this._stage += 1;

        const resumeThisPartition = pause();

        setTimeout(resumeThisPartition, this._delay);
      },
    });
  }

  runWithDelay() {
    if (this._isRunning) {
      return;
    }

    this._isRunning = true;

    this._connectAndRun();
  }

  get isRunning() {
    return this._isRunning;
  }
}
