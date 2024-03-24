import type { Consumer } from "kafkajs";
import { kafka } from "./kafka";

export class MessageConsumer<V> {
  readonly consumer: Consumer;
  private readonly _callback: (msg: V) => void;
  private readonly _delay: number;
  private readonly _topic: string;
  private _isRunning: boolean = false;

  constructor(topic: string, callback: (msg: V) => void, delay: number) {
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
      fromBeginning: true,
    });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log(
          "[consumer] Received message:",
          topic,
          partition,
          message.value?.toString()
        );

        if (!message.value) {
          return;
        }

        const msg = JSON.parse(message.value.toString()) as V;

        this._callback(msg);
      },
    });

    await this.consumer.disconnect();
  }

  runWithDelay() {
    if (this._isRunning) {
      return;
    }

    // setInterval(() => {
    //   this._connectAndRun();
    // }, this._delay);

    this._isRunning = true;

    this._connectAndRun();
  }

  get isRunning() {
    return this._isRunning;
  }
}
