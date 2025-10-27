import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faCopy } from "@fortawesome/free-solid-svg-icons";
import "../CSS/Universal.css";
import "../CSS/ChatSection.css"
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DOMPurify from "dompurify";

const LOCAL_WEBHOOK_URL = "http://localhost:5678/webhook/ReactChat";
const STORAGE_KEY = "chat_history_v1";
const MODELS = [{
    id: "gemini 1.5-flash",
    label: "Gemini 1.5-flash"
},
{
    id: "gemini 1.5-pro",
    label: "Gemini 1.5-pro"
},
{
    id: "gemini 2.5-pro",
    label: "Gemini 2.5-pro"
}
]

const ChatSection = () => {
    const seedMessage = { role: "bot", text: "Hello. Can I help you?" };
    const [model, setModel] = useState(MODELS[2].id)

    const [messages, setMessages] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [seedMessage];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) && parsed.length ? parsed : [seedMessage];
        } catch {
            return [seedMessage];
        }
    });

    const [userMessage, setUserMessage] = useState("");
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const chatBodyRef = useRef(null);

    useEffect(() => {
        const el = chatBodyRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        } catch (e) {
            console.warn("Cannot persist chat:", e);
        }
    }, [messages]);

    const clearHistory = () => {
        setMessages([seedMessage]);
        setError("");
        setStatus("idle");
        try { localStorage.removeItem(STORAGE_KEY); } catch { }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const text = userMessage.trim();
        if (!text || status === "loading") return;

        setMessages((prev) => [...prev, { role: "user", text }]);
        setUserMessage("");
        setStatus("loading");
        setError("");

        const loadingId = Date.now();
        setMessages((prev) => [
            ...prev,
            { id: loadingId, role: "bot", text: `thinking with ${model}...` },
        ]);

        try {
            const r = await fetch(LOCAL_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text,
                    model: model
                }),
            });

            const ctype = r.headers.get("content-type") || "";
            let data;
            if (ctype.includes("application/json")) {
                data = await r.json();
            } else {
                data = { message: await r.text() };
            }

            if (!r.ok) throw new Error(data?.message || `HTTP ${r.status}`);

            const reply =
                data?.message ?? data?.answer ?? data?.output ?? JSON.stringify(data);

            setMessages((prev) =>
                prev.map((m) => (m.id === loadingId ? { ...m, text: String(reply) } : m))
            );
            setStatus("success");
        } catch (err) {
            const msg = err?.message || "Unknown error";
            setError(msg);
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === loadingId ? { ...m, text: `ขอโทษนะ มีปัญหา: ${msg}` } : m
                )
            );
            setStatus("error");
        }
    };

    const enhance = (md = "") =>
        md.replace(/\*\*มติ:\*\*/g, "**มติ:**");

    const sanitize = (md = "") => DOMPurify.sanitize(md);

    return (
        <div className="content-container">
            <div className="content-header">
                <div className="header-name">
                    <h1>AI chat</h1>
                    <p>Internship Project</p>
                </div>
                <div className="header-button">
                    <select
                        className="border rounded px-2 py-1 header-select"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        title="เลือกโมเดลสำหรับคำตอบ"
                    >
                        {MODELS.map((m) => (
                            <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                    </select>
                    <button className="clear-btn" onClick={clearHistory} disabled={status === "loading"}>
                        Clear History
                    </button>
                </div>
            </div>

            <div className="chat-body" ref={chatBodyRef}>
                {messages.map((m, i) => (
                    <div
                        key={m.id ?? i}
                        className={`message ${m.role === "user" ? "user-message" : "bot-message"}`}
                    >
                        <div className="message-body">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    p: ({ children, className }) => (
                                        <p className={`message-text ${className ?? ""}`}>{children}</p>
                                    ),
                                    strong: ({ children, className }) => (
                                        <strong className={`font-semibold ${className ?? ""}`}>{children}</strong>
                                    ),
                                    ol: ({ children, className }) => (
                                        <ol className={`list-decimal ml-6 my-2 ${className ?? ""}`}>{children}</ol>
                                    ),
                                    ul: ({ children, className }) => (
                                        <ul className={`list-disc ml-6 my-2 ${className ?? ""}`}>{children}</ul>
                                    ),
                                    li: ({ children, className }) => (
                                        <li className={`my-1 ${className ?? ""}`}>{children}</li>
                                    ),
                                    code: ({ inline, children, className }) =>
                                        inline ? (
                                            <code className={`px-1 rounded bg-gray-100 ${className ?? ""}`}>{children}</code>
                                        ) : (
                                            <pre className="p-3 rounded bg-gray-100 overflow-auto">
                                                <code className={className}>{children}</code>
                                            </pre>
                                        ),
                                    blockquote: ({ children, className }) => (
                                        <blockquote className={`border-l-4 pl-3 text-gray-700 italic ${className ?? ""}`}>
                                            {children}
                                        </blockquote>
                                    ),
                                }}

                            >
                                {sanitize(enhance(m.text))}
                            </ReactMarkdown>
                        </div>

                        <button
                            className={`message-button ${m.role === "user" ? "user" : "bot"}`}
                            onClick={() => {
                                navigator.clipboard.writeText(m.text ?? "")
                                    .then(() => {
                                        const toast = document.createElement("div");
                                        toast.className = "toast";
                                        toast.textContent = "Copied to clipboard";
                                        document.body.appendChild(toast);
                                        setTimeout(() => toast.remove(), 2000);
                                    })
                                    .catch(() => alert("Copy failed"));
                            }}
                            title="คัดลอกข้อความ"
                        >
                            <FontAwesomeIcon icon={faCopy} size="lg" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="chat-footer">
                <form className="chat-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder={status === "loading" ? "Please waiting for response." : "Enter your question here."}
                        className="message-input"
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        required
                        disabled={status === "loading"}
                    />
                    <button type="submit" disabled={status === "loading"} aria-label="Send">
                        <FontAwesomeIcon icon={faPaperPlane} size="lg" />
                    </button>
                </form>
                {status === "error" && <div className="chat-error">{error}</div>}
            </div>
        </div>
    );
};

export default ChatSection;
