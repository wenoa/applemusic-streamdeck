import type { KeyAction } from "@elgato/streamdeck";
import type { KeyImage } from "../images/key-image";
import type { Display } from "./display";

export class StreamDeckDisplay implements Display {
  private shownImage = "";

  constructor(private readonly key: Pick<KeyAction<never>, "setImage" | "showAlert">) {
  }

  async show(anImage: KeyImage) {
    const dataUri = anImage.dataUri();

    // Resending an unchanged image floods the Stream Deck connection and lags its UI.
    if (dataUri === this.shownImage) {
      return;
    }

    this.shownImage = dataUri;
    await this.key.setImage(dataUri);
  }

  async alert() {
    await this.key.showAlert();
  }
}
