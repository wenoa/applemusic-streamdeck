import { spawn } from "node:child_process";
import type { Writable } from "node:stream";
import type { Timer } from "../../core/timer";
import type { AppleMusic } from "../apple-music";
import type { BridgeEventData } from "./bridge-events";
import { BridgeEventRegistry } from "./bridge-events";
import { LineBuffer } from "./line-buffer";
import type { BridgeCommand, MusicBridge } from "./music-bridge";

export interface BridgeLogger {
  error(...someDetails: unknown[]): unknown;
}

interface BridgeProcess {
  send(aCommand: BridgeCommand): void;
}

class DisconnectedBridgeProcess implements BridgeProcess {
  send() {
  }
}

class RunningBridgeProcess implements BridgeProcess {
  constructor(private readonly input: Writable) {
  }

  send(aCommand: BridgeCommand) {
    this.input.write(`${JSON.stringify(aCommand)}\n`);
  }
}

export class ProcessMusicBridge implements MusicBridge {
  private process: BridgeProcess = new DisconnectedBridgeProcess();
  private readonly events = new BridgeEventRegistry();

  constructor(
    private readonly executable: string,
    private readonly executableArguments: string[],
    private readonly logger: BridgeLogger,
    private readonly restart: Timer,
  ) {
  }

  connect(anAppleMusic: AppleMusic) {
    const bridge = spawn(this.executable, this.executableArguments, { stdio: ["pipe", "pipe", "pipe"] });
    const output = new LineBuffer();
    this.process = new RunningBridgeProcess(bridge.stdin);

    bridge.stdout.setEncoding("utf8");
    bridge.stdout.on("data", (chunk: string) => {
      output
        .appendAndExtractCompleteLines(chunk)
        .forEach(line => this.deliver(line, anAppleMusic));
    });
    bridge.stderr.setEncoding("utf8");
    bridge.stderr.on("data", (chunk: string) => this.logger.error("Music bridge:", chunk.trim()));
    bridge.stdin.on("error", error => this.logger.error("Could not write to the Music bridge:", error));
    bridge.on("error", error => this.logger.error("Music bridge failed:", error));
    bridge.on("close", exitCode => {
      this.logger.error(`Music bridge exited with code ${exitCode}`);
      this.process = new DisconnectedBridgeProcess();
      anAppleMusic.bridgeDisconnected();
      this.restart.start(async () => this.connect(anAppleMusic));
    });
  }

  send(aCommand: BridgeCommand) {
    this.process.send(aCommand);
  }

  private deliver(aLine: string, anAppleMusic: AppleMusic) {
    try {
      const data: BridgeEventData = JSON.parse(aLine);
      this.events
        .eventFrom(data)
        .handle(anAppleMusic)
        .catch(error => this.logger.error("Could not handle a Music bridge event:", error));
    } catch (error) {
      this.logger.error("Ignored a malformed Music bridge event:", error);
    }
  }
}
