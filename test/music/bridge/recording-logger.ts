import type { BridgeLogger } from "../../../src/music/bridge/process-music-bridge";

export class RecordingLogger implements BridgeLogger {
  private messages: string[] = [];

  error(...details: unknown[]) {
    this.messages = [...this.messages, details.map(detail => String(detail)).join(" ")];
  }

  hasLogged(text: string) {
    return this.messages.some(message => message.includes(text));
  }
}
