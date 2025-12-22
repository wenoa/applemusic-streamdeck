export class LineBuffer {
  private incompleteLine = "";

  appendAndExtractCompleteLines(aChunk: string) {
    const lines = (this.incompleteLine + aChunk).split("\n");
    this.incompleteLine = lines[lines.length - 1];

    return lines.slice(0, -1);
  }
}
