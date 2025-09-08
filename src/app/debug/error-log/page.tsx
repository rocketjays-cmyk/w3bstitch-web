import fs from "fs";
import path from "path";

export default function ErrorLogPage() {
  const logPath = path.join(process.cwd(), "error.log");
  let content: string;
  try {
    content = fs.readFileSync(logPath, "utf8");
  } catch {
    content = "No error.log found.";
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Error Log</h1>
      <p>
        Showing contents of <code>{logPath}</code>
      </p>
      <pre
        style={{
          background: "#111",
          color: "#eee",
          padding: 12,
          borderRadius: 8,
          maxHeight: "70vh",
          overflowY: "auto",
          whiteSpace: "pre-wrap",
        }}
      >
        {content}
      </pre>
    </main>
  );
}
