import type { AppleMusic } from "../../src/music/apple-music";
import type { BridgeEventData } from "../../src/music/bridge/bridge-events";
import { BridgeEventRegistry } from "../../src/music/bridge/bridge-events";
import type { BridgeCommand, MusicBridge } from "../../src/music/bridge/music-bridge";

type BridgeAnswer = () => Promise<void>;

export class FakeMusicBridge implements MusicBridge {
  private connectedMusic: AppleMusic[] = [];
  private sentCommands: BridgeCommand[] = [];
  private situationOfMusic: BridgeEventData = { type: "closed" };
  private reportedSituation = "";
  private readonly events = new BridgeEventRegistry();
  private readonly answers = new Map<string, BridgeAnswer>([
    ["reportSituation", async () => this.reportChangedSituation()],
  ]);

  connect(music: AppleMusic) {
    this.connectedMusic = [...this.connectedMusic, music];
  }

  send(command: BridgeCommand) {
    this.sentCommands = [...this.sentCommands, command];
    void this.answers.get(command.command)?.();
  }

  async report(data: BridgeEventData) {
    this.situationOfMusic = data;
    this.reportedSituation = JSON.stringify(data);
    await Promise.all(this.connectedMusic.map(music => this.events.eventFrom(data).handle(music)));
    await this.settle();
  }

  // Music changes some things (like a favorite) a while after it was asked to, without notifying anyone.
  musicChangesWithoutNotice(data: BridgeEventData) {
    this.situationOfMusic = data;
  }

  // Like the real bridge, it only reports Music's situation when it changed since the last report.
  private async reportChangedSituation() {
    if (JSON.stringify(this.situationOfMusic) !== this.reportedSituation) {
      await this.report(this.situationOfMusic);
    }
  }

  // Lets the requests that wait for the bridge's answers finish what they started.
  async settle() {
    await new Promise(resolve => setTimeout(resolve));
  }

  disconnect() {
    this.connectedMusic.forEach(music => music.bridgeDisconnected());
  }

  lastCommand() {
    return this.sentCommands.at(-1) ?? { command: "" };
  }

  commandsSent() {
    return this.sentCommands;
  }
}
