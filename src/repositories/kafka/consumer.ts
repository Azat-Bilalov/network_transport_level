import type { Consumer } from "kafkajs";
import { kafka } from "./kafka";
import { messageToLogFormat } from "../../utils/messageToLogFormat";

export class MessageConsumer<V extends { payload: string | null }> {
  readonly consumer: Consumer;
  private readonly _onMessage: (msg: V, stage: number) => void;
  private readonly _onStage: (stage: number) => void;
  private readonly _delay: number;
  private readonly _topic: string;
  private _isRunning: boolean = false;
  private _stage: number = 0;

  constructor(
    topic: string,
    onMessage: (msg: V, stage: number) => void,
    onStage: (stage: number) => void,
    delay: number
  ) {
    if (!topic) {
      throw new Error(`${topic} is not defined`);
    }

    const groupId = Date.now().toString();

    this.consumer = kafka.consumer({ groupId });
    this._onMessage = onMessage;
    this._onStage = onStage;
    this._delay = delay;
    this._topic = topic;
  }

  private async _connectAndRun() {
    await this.consumer.connect();

    await this.consumer.subscribe({
      topic: this._topic,
      fromBeginning: false,
    });

    const messages: V[] = [];

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) {
          return;
        }

        const msg = JSON.parse(message.value.toString()) as V;

        messages.push(msg);
      },
    });

    setInterval(() => {
      console.log("[consumer] Stage:", this._stage);

      this._onStage(this._stage);

      messages.map((message) => {
        console.log(
          "[consumer] Received message:",
          messageToLogFormat(message)
        );

        this._onMessage(message, this._stage);
      });

      messages.length = 0;

      this._stage += 1;
    }, this._delay);
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
