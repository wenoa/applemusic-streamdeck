import type { KeyImage } from "../images/key-image";

export interface Display {
  show(anImage: KeyImage): Promise<void>;

  alert(): Promise<void>;
}
