import { useState, useRef, useEffect } from "react";

const MODELS = [
  { id: "gemini-2.5-pro", label: "Google - Gemini 2.5 Pro" },
  { id: "gemini-2.0-pro", label: "Google - Gemini 2.0 Pro" },
];

const WEBHOOK_URL = "http://localhost:5678/webhook-test/React";

export default function TestingSection() {
  const [model, setModel] = useState(MODELS[0].id);
  const [messages, setMessages] = useState([
    { role: "system", content: "You are a helpful assistant." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: newMessages,
          temperature: 0.7,
          top_p: 1.0,
          sessionId: "demo-session",
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: `เกิดข้อผิดพลาด: ${String(err)}` }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="h-screen max-w-3xl mx-auto p-4 flex flex-col gap-3">
      <header className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">Multi-Model Chat</h1>
        <select
          className="border rounded px-2 py-1"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          title="เลือกโมเดลสำหรับคำตอบ"
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </header>

      <div className="flex-1 overflow-auto border rounded p-3 space-y-3">
        {messages.filter(m => m.role !== "system").map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "text-right" : "text-left"}
          >
            <div className={`inline-block rounded px-3 py-2 ${m.role === "user" ? "bg-blue-100" : "bg-gray-100"}`}>
              <pre className="whitespace-pre-wrap break-words font-sans">{m.content}</pre>
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-gray-500">กำลังพิมพ์…</div>}
        <div ref={endRef} />
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="พิมพ์ข้อความ..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="border rounded px-4 py-2"
          type="submit"
          disabled={loading}
        >
          ส่ง
        </button>
      </form>
    </div>
  );
}
