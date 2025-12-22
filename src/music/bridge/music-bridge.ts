import type { AppleMusic } from "../apple-music";

export type BridgeCommand = {
  command: string;
  percentagePoints?: number;
  playlist?: string;
};

export interface MusicBridge {
  connect(anAppleMusic: AppleMusic): void;

  send(aCommand: BridgeCommand): void;
}
