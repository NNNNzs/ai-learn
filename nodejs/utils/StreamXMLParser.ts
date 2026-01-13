type TagHandler = {
  onStart?: () => void;
  onChunk?: (text: string) => void;
  onFinish?: (text: string) => void;
};

type StreamXMLParserOptions = {
  handlers: Record<string, TagHandler>;
};
export class StreamXMLParser {
  private buffer = "";
  private state: "IDLE" | "QUESTION" | "ANSWER" | "FINISH" = "IDLE";
  private questionPrintedLen = 0;

  constructor(private handlers: {
    onQuestionChunk?: (text: string) => void;
    onQuestionFinish?: (text: string) => void;
    onAnswerFinish?: (text: string) => void;
    onFinish?: (text: string) => void;
  }) { }

  push(chunk: string) {
    this.buffer += chunk;
    this.parse();
  }

  private parse() {
    while (true) {
      if (this.state === "IDLE") {
        const qStart = this.buffer.indexOf("<question>");
        const aStart = this.buffer.indexOf("<answer>");
        const fStart = this.buffer.indexOf("<finish>");

        const next = Math.min(
          ...[qStart, aStart, fStart].filter(i => i !== -1)
        );

        if (next === Infinity) return;

        if (next === qStart) {
          this.buffer = this.buffer.slice(qStart + 10);
          this.state = "QUESTION";
        } else if (next === aStart) {
          this.buffer = this.buffer.slice(aStart + 8);
          this.state = "ANSWER";
        } else if (next === fStart) {
          this.buffer = this.buffer.slice(fStart + 8);
          this.state = "FINISH";
        }
      }

      if (this.state === "QUESTION") {
        const end = this.buffer.indexOf("</question>");

        if (end === -1) {
          const delta = this.buffer.slice(this.questionPrintedLen);
          const lt = delta.indexOf("<");

          if (lt !== -1) {
            const safe = delta.slice(0, lt);
            if (safe) {
              this.handlers.onQuestionChunk?.(safe);
              this.questionPrintedLen += safe.length;
            }
            return; // 等更多 chunk
          }

          if (delta) {
            this.handlers.onQuestionChunk?.(delta);
            this.questionPrintedLen = this.buffer.length;
          }
          return;
        }

        // 完整 question
        const content = this.buffer.slice(0, end);
        this.handlers.onQuestionFinish?.(content);

        this.buffer = this.buffer.slice(end + 11);
        this.questionPrintedLen = 0;
        this.state = "IDLE";
        continue;
      }

      if (this.state === "ANSWER") {
        const end = this.buffer.indexOf("</answer>");
        if (end === -1) return;

        const content = this.buffer.slice(0, end);
        this.handlers.onAnswerFinish?.(content);

        this.buffer = this.buffer.slice(end + 9);
        this.state = "IDLE";
        continue;
      }

      if (this.state === "FINISH") {
        const end = this.buffer.indexOf("</finish>");
        if (end === -1) return;

        const content = this.buffer.slice(0, end);
        this.handlers.onFinish?.(content);

        this.buffer = this.buffer.slice(end + 9);
        this.state = "IDLE";
        continue;
      }
    }
  }
}
