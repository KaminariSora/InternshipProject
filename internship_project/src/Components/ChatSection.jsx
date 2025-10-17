import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import "../CSS/Universal.css";
import "../CSS/ChatSection.css"

const LOCAL_WEBHOOK_URL = "http://localhost:5678/webhook-test/ReactChat";
const STORAGE_KEY = "chat_history_v1";

const ChatSection = () => {
    const seedMessage = { role: "bot", text: "Hello. Can I help you?" };

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
            { id: loadingId, role: "bot", text: "thinking..." },
        ]);

        try {
            const r = await fetch(LOCAL_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
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

    return (
        <div className="content-container">
            <div className="content-header">
                <h1>AI chat</h1>
                <p>Internship Project</p>
                <button className="clear-btn" onClick={clearHistory} disabled={status === "loading"}>
                    ล้างประวัติ
                </button>
            </div>

            <div className="chat-body" ref={chatBodyRef}>
                {messages.map((m, i) => (
                    <pre
                        key={m.id ?? i}
                        className={`message ${m.role === "user" ? "user-message" : "bot-message"}`}
                    >
                        <p className="message-text">{m.text}</p>
                        <button className="message-button">copy</button>
                    </pre>
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
                {status === "error" && <div className="chat-error">✖ {error}</div>}
            </div>
        </div>
    );
};

export default ChatSection;
