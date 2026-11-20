// Configuration point: it only wires the real collaborators, so no test exercises it.
/* v8 ignore file -- @preserve */
import streamDeck from "@elgato/streamdeck";
import { spawnSync } from "node:child_process";
import { chmodSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { AppleMusicActions } from "./actions/apple-music-actions";
import { StreamDeckPropertyInspector } from "./actions/property-inspector";
import { TimeoutTimer } from "./core/timeout";
import { KeyImages } from "./images/key-images";
import { AppleMusic } from "./music/apple-music";
import { ProcessMusicBridge } from "./music/bridge/process-music-bridge";
import { AppleCatalog } from "./music/catalog/apple-catalog";
import { CatalogCovers } from "./music/catalog/catalog-covers";

const bridgeExecutable = fileURLToPath(new URL("music-bridge", import.meta.url));
// `streamdeck pack` doesn't keep the executable bit, so an installed plugin gets the bridge without it.
chmodSync(bridgeExecutable, 0o755);
const bridge = new ProcessMusicBridge(
  bridgeExecutable,
  [],
  streamDeck.logger,
  new TimeoutTimer(5000),
);
// Half a second between checks: Music is followed for five seconds after every change.
const music = AppleMusic.connectedThrough(bridge, new TimeoutTimer(500));
const images = KeyImages.inLanguage(streamDeck.info.application.language);
// Node doesn't get the Mac's region when Stream Deck starts the plugin, so it's read from the system preferences.
const macLocale = spawnSync("defaults", ["read", "-g", "AppleLocale"], { encoding: "utf8" }).stdout ?? "";
const catalogCovers = CatalogCovers.forMacLocale(new AppleCatalog(), macLocale);

new AppleMusicActions(music, images, new StreamDeckPropertyInspector(), catalogCovers).forEach(action => streamDeck.actions.registerAction(action));

await streamDeck.connect();
