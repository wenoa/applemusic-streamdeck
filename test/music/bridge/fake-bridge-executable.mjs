import { closeSync } from "node:fs";

// Stands in for the Swift bridge: it answers each command the way the test needs to observe it.
const answers = {
  listPlaylists: () => ({
    type: "playlists",
    playlists: [
      {
        id: "26C1DEB09689BE33",
        name: "Work",
      },
    ],
  }),
  togglePlayback: () => ({ type: "stopped" }),
  complain: () => {
    process.stderr.write("something went wrong\n");
  },
  mumble: () => {
    process.stdout.write("this is not json\n");
  },
  stopListening: () => {
    closeSync(0);
  },
  quit: () => process.exit(3),
};

let incomplete = "";

process.stdin.setEncoding("utf8");
process.stdin.pause();
process.stdin.on("data", chunk => {
  const lines = (incomplete + chunk).split("\n");
  incomplete = lines.pop();
  lines
    .map(line => JSON.parse(line))
    .map(message => (answers[message.command] ?? (() => undefined))(message))
    .filter(answer => answer !== undefined)
    .forEach(answer => process.stdout.write(`${JSON.stringify(answer)}\n`));
});
process.stdin.on("end", () => process.exit(0));

// The first report arrives in two pieces; commands are answered once it is complete.
const firstReport = JSON.stringify({ type: "closed" });
process.stdout.write(firstReport.slice(0, 8));
setTimeout(() => {
  process.stdout.write(`${firstReport.slice(8)}\n`);
  process.stdin.resume();
}, 20);
setTimeout(() => process.exit(0), 10_000);
