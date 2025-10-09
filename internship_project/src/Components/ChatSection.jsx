import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import "../CSS/ChatSection.css";

const LOCAL_WEBHOOK_URL = "http://localhost:5678/webhook/ReactChat";
const LOCAL_TEST_WEBHOOK_URL = "http://localhost:5678/webhook-test/ReactChat"

const ChatSection = () => {
    const [userMessage, setUserMessage] = useState("");
    const [messages, setMessages] = useState([
        { role: "bot", text: "Hello. Can I help you?" },
    ]);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const chatBodyRef = useRef(null);

    useEffect(() => {
        const el = chatBodyRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages]);

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
                prev.map((m) =>
                    m.id === loadingId ? { ...m, text: String(reply) } : m
                )
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
        <div className="chat-container">
            <div className="chat-header">
                <h1>AI chat</h1>
                <p>Internship Project</p>
            </div>

            <div className="chat-body" ref={chatBodyRef}>
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={`message ${m.role === "user" ? "user-message" : "bot-message"}`}
                    >
                        <p className="message-text">{m.text}</p>
                    </div>
                ))}
            </div>

            <div className="chat-footer">
                <form className="chat-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder={
                            status === 'loading' ? "Please waiting for response." : "Enter your question here."
                        }
                        className="message-input"
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        required
                        disabled={status === 'loading'}
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
