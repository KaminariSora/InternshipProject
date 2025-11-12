import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faCopy, faEllipsis } from "@fortawesome/free-solid-svg-icons";
import "../CSS/Universal.css";
import "../CSS/ChatSection.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DOMPurify from "dompurify";

const LOCAL_WEBHOOK_URL = "https://76c45653f311.ngrok-free.app/webhook/ReactChat";
// const LOCAL_WEBHOOK_URL = "http://localhost:5678/webhook-test/ReactChat";
const STORAGE_KEY = "chat_conversations_v1";

const MODELS = [
    { id: "gemini 1.5-flash", label: "Gemini 1.5-flash" },
    { id: "gemini 1.5-pro", label: "Gemini 1.5-pro" },
    { id: "gemini 2.5-pro", label: "Gemini 2.5-pro" },
];

const makeId = () =>
    Date.now().toString() + Math.random().toString(16).slice(2);

const ChatSection = () => {
    const [conversations, setConversations] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length) return parsed;
            }
        } catch (e) {
            console.warn("Cannot load conversations:", e);
        }
        return [
            {
                id: makeId(),
                title: "New chat",
                messages: [
                    { id: makeId(), role: "bot", text: "Hello. Can I help you?" },
                ],
            },
        ];
    });

    const [activeId, setActiveId] = useState("c1");
    const activeConversation = conversations.find((c) => c.id === activeId);

    const [model, setModel] = useState(MODELS[2].id);
    const [userMessage, setUserMessage] = useState("");
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [clearComfirm, setClearConfirm] = useState(false);
    const [openFormId, setOpenFormId] = useState(null);
    const chatBodyRef = useRef(null);
    const historyButtonRef = useRef(null)
    const [editingId, setEditingId] = useState(null);
    const [draftTitle, setDraftTitle] = useState("");

    useEffect(() => {
        const el = chatBodyRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [conversations]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
        } catch (e) {
            console.warn("Cannot persist conversations:", e);
        }
    }, [conversations]);

    const openClearHistoryWindow = () => {
        setClearConfirm(true);
    };

    const handleConfirmClearHistory = () => {
        setConversations((prev) =>
            prev.map((conv) => {
                if (conv.id !== activeId) return conv;
                return {
                    ...conv,
                    messages: [
                        { id: makeId(), role: "bot", text: "Hello. Can I help you?" },
                    ],
                };
            })
        );
        setClearConfirm(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (historyButtonRef.current && !historyButtonRef.current.contains(event.target)) {
                setOpenFormId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const text = userMessage.trim();
        if (!text || status === "loading" || !activeConversation) return;

        setStatus("loading");
        setError("");
        setUserMessage("");

        const loadingId = makeId();

        // ดึงห้องปัจจุบัน + sessionId เดิม (หรือสร้างใหม่แล้วผูกกลับเข้า state)
        const current = conversations.find((c) => c.id === activeId);
        let sessionId = current?.sessionId;
        if (!sessionId) {
            sessionId = "s" + makeId();
            setConversations((prev) =>
                prev.map((c) => (c.id === activeId ? { ...c, sessionId } : c))
            );
        }

        // render ข้อความ user + บับเบิลกำลังคิด
        setConversations((prev) =>
            prev.map((conv) => {
                if (conv.id !== activeId) return conv;
                const isFirstUserMsg = conv.messages.every((m) => m.role !== "user");
                return {
                    ...conv,
                    title: isFirstUserMsg
                        ? text.length > 40
                            ? text.slice(0, 40) + "..."
                            : text
                        : conv.title,
                    messages: [
                        ...conv.messages,
                        { id: Date.now() - 1, role: "user", text },
                        { id: loadingId, role: "bot", text: `thinking with ${model}...` },
                    ],
                };
            })
        );

        try {
            const r = await fetch(LOCAL_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, model, sessionId }),
            });

            const ctype = r.headers.get("content-type") || "";
            const data = ctype.includes("application/json") ? await r.json() : { message: await r.text() };
            if (!r.ok) throw new Error(data?.message || `HTTP ${r.status}`);

            const reply = data?.message ?? data?.answer ?? data?.output ?? JSON.stringify(data);

            setConversations((prev) =>
                prev.map((conv) =>
                    conv.id === activeId
                        ? {
                            ...conv,
                            messages: conv.messages.map((m) =>
                                m.id === loadingId ? { ...m, text: String(reply) } : m
                            ),
                        }
                        : conv
                )
            );
            setStatus("success");
        } catch (err) {
            const msg = err?.message || "Unknown error";
            setError(msg);
            setConversations((prev) =>
                prev.map((conv) =>
                    conv.id === activeId
                        ? {
                            ...conv,
                            messages: conv.messages.map((m) =>
                                m.id === loadingId ? { ...m, text: `ขอโทษนะ มีปัญหา: ${msg}` } : m
                            ),
                        }
                        : conv
                )
            );
            setStatus("error");
        }
    };

    // (ของเดิม)
    const enhance = (md = "") => md.replace(/\*\*มติ:\*\*/g, "**มติ:**");
    const sanitize = (md = "") => DOMPurify.sanitize(md);
    const sanitizeTitle = (t) => {
        const s = (t ?? "").trim();
        return s.length ? (s.length > 60 ? s.slice(0, 60) + "…" : s) : "new chat";
    };

    const createNewChat = () => {
        const newChat = {
            id: "c" + makeId(),
            sessionId: "s" + makeId(),
            title: "new chat",
            messages: [{ id: makeId(), role: "bot", text: "Hello. Can I help you?" }],
        };
        setConversations((prev) => [newChat, ...prev]);
        setActiveId(newChat.id);
    };

    const startRename = (id, currentTitle = "") => {
        setEditingId(id);
        setDraftTitle(currentTitle);
        setOpenFormId(null);
    };

    const saveRename = () => {
        setConversations(prev =>
            prev.map(c => (c.id === editingId ? { ...c, title: sanitizeTitle(draftTitle) } : c))
        );
        setEditingId(null);
    };

    const cancelRename = () => {
        setEditingId(null);
        setDraftTitle("");
    };

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
                        title="Choose model to answer."
                    >
                        {MODELS.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.label}
                            </option>
                        ))}
                    </select>
                    <button
                        className="clear-btn"
                        onClick={openClearHistoryWindow}
                        disabled={status === "loading"}
                    >
                        Clear History
                    </button>
                </div>
            </div>

            <div className="main-container">
                <div className="history-box">
                    <button className="new-chat-btn" onClick={createNewChat}>
                        + New Chat
                    </button>
                    <ul className="history-list">
                        {conversations.map((conv) => (
                            <li
                                key={conv.id}
                                className={conv.id === activeId ? "active selected" : ""}
                                onClick={() => setActiveId(conv.id)}
                            >
                                {/* ชื่อแชท: โหมดดู / โหมดแก้ */}
                                {editingId === conv.id ? (
                                    <input
                                        className="rename-input"
                                        value={draftTitle}
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => setDraftTitle(e.target.value)}
                                        onBlur={saveRename}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") saveRename();
                                            if (e.key === "Escape") cancelRename();
                                        }}
                                        placeholder="ตั้งชื่อแชท…"
                                    />
                                ) : (
                                    <span>{conv.title}</span>
                                )}

                                <button
                                    className="selection-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenFormId(prev => (prev === conv.id ? null : conv.id));
                                    }}
                                    title="More actions"
                                >
                                    <FontAwesomeIcon icon={faEllipsis} />
                                </button>

                                {openFormId === conv.id && (
                                    <div
                                        ref={historyButtonRef}
                                        className="selectionForm"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ul>
                                            <li onClick={() => startRename(conv.id, conv.title)}>Rename</li>
                                            <li
                                                onClick={() => {
                                                    setConversations(prev => prev.filter(c => c.id !== conv.id));
                                                    if (conv.id === activeId) {
                                                        const next = conversations.find(c => c.id !== conv.id);
                                                        if (next) setActiveId(next.id);
                                                    }
                                                    setOpenFormId(null);
                                                }}
                                            >
                                                Delete Chat
                                            </li>
                                            <li onClick={() => setOpenFormId(null)}>Cancel</li>
                                        </ul>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="chat-body" ref={chatBodyRef}>
                    {activeConversation?.messages.map((m) => (
                        <div
                            key={m.id}
                            className={`message ${m.role === "user" ? "user-message" : "bot-message"
                                }`}
                        >
                            <div className="message-body">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        p: ({ children, className }) => (
                                            <p className={`message-text ${className ?? ""}`}>
                                                {children}
                                            </p>
                                        ),
                                        strong: ({ children, className }) => (
                                            <strong
                                                className={`font-semibold ${className ?? ""}`}
                                            >
                                                {children}
                                            </strong>
                                        ),
                                        ol: ({ children, className }) => (
                                            <ol
                                                className={`list-decimal ml-6 my-2 ${className ?? ""}`}
                                            >
                                                {children}
                                            </ol>
                                        ),
                                        ul: ({ children, className }) => (
                                            <ul
                                                className={`list-disc ml-6 my-2 ${className ?? ""}`}
                                            >
                                                {children}
                                            </ul>
                                        ),
                                        li: ({ children, className }) => (
                                            <li className={`my-1 ${className ?? ""}`}>
                                                {children}
                                            </li>
                                        ),
                                        code: ({ inline, children, className }) =>
                                            inline ? (
                                                <code className={`px-1 rounded bg-gray-100 inline-code ${className ?? ""}`}>{children}</code>
                                            ) : (
                                                <pre className="p-3 rounded bg-gray-100 overflow-auto message-pre">
                                                    <code className={className}>{children}</code>
                                                </pre>
                                            ),
                                        blockquote: ({ children, className }) => (
                                            <blockquote
                                                className={`border-l-4 pl-3 text-gray-700 italic ${className ?? ""}`}
                                            >
                                                {children}
                                            </blockquote>
                                        ),
                                    }}
                                >
                                    {sanitize(enhance(m.text))}
                                </ReactMarkdown>
                            </div>

                            <button
                                className={`message-button ${m.role === "user" ? "user" : "bot"
                                    }`}
                                onClick={() => navigator.clipboard.writeText(m.text ?? "")}
                                title="คัดลอกข้อความ"
                            >
                                <FontAwesomeIcon icon={faCopy} size="lg" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {clearComfirm && (
                <div className="confirm-window">
                    <h1>Are you sure? </h1>
                    <div>
                        <button onClick={handleConfirmClearHistory}>Yes</button>
                        <button onClick={() => setClearConfirm(false)}>Cancel</button>
                    </div>
                </div>
            )}

            <div className="chat-footer">
                <form className="chat-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder={
                            status === "loading"
                                ? "Please wait for response..."
                                : "Enter your question here."
                        }
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