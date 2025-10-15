import "../CSS/OCRSection.css";
import FileDocument from "./icons/FileDocument";
import { useRef, useState } from "react";

const WEBHOOK_URL = "http://localhost:5678/webhook/OCR"; // เปลี่ยนตามของจริง
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

export default function OCRSection() {
    const fileInputRef = useRef(null);
    const [status, setStatus] = useState("idle"); // idle | uploading | success | error
    const [message, setMessage] = useState("");
    const [ocrResult, setOcrResult] = useState("");

    const openPicker = () => fileInputRef.current?.click();

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // ✅ validate
        if (file.type !== "application/pdf") {
            setStatus("error");
            setMessage("❌ ต้องเป็นไฟล์ PDF เท่านั้น");
            e.target.value = ""; // reset
            return;
        }
        if (file.size > MAX_SIZE) {
            setStatus("error");
            setMessage("❌ ไฟล์ใหญ่เกิน 25MB");
            e.target.value = "";
            return;
        }

        setStatus("uploading");
        setMessage(`📤 กำลังอัปโหลด: ${file.name}`);
        setOcrResult("");

        try {
            const formData = new FormData();
            formData.append("pdf", file);
            formData.append("note", "React Upload Test");

            const res = await fetch(WEBHOOK_URL, { method: "POST", body: formData });

            let data;
            const ct = res.headers.get("content-type") || "";
            if (ct.includes("application/json")) {
                data = await res.json();
            } else {
                data = { ok: res.ok, context: await res.text() };
            }
            if (!res.ok || data?.ok === false) {
                throw new Error(data?.message || `HTTP ${res.status}`);
            }

            const context =
                Array.isArray(data)
                    ? (data[0]?.context ?? data[0]?.json?.context)
                    : (data?.context ?? data?.result?.context ?? data);

            setOcrResult(String(context ?? "").trim());
            setStatus("success");
            setMessage(`✅ อัปโหลดสำเร็จ`);
        } catch (err) {
            setStatus("error");
            setMessage(`❌ อัปโหลดล้มเหลว: ${err?.message || "Unknown error"}`);
        } finally {
            e.target.value = "";
        }
    };

    return (
        <div className="content-container">
            <div className="content-header">
                <h1>OCR</h1>
                <p>Internship Project</p>
            </div>

            <div className="ocr-body">
                <div className="ocr-center">
                    <FileDocument />
                    <h1>Upload a PDF File</h1>
                    <p>Select a PDF file to extract text content</p>

                    <button onClick={openPicker} disabled={status === "uploading"}>
                        {status === "uploading" ? "Uploading..." : "Choose PDF File"}
                    </button>

                    <input
                        type="file"
                        accept="application/pdf"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                    />

                    {message && (
                        <p style={{ marginTop: 10, color: status === "error" ? "#d32f2f" : "#2e7d32" }}>
                            {message}
                        </p>
                    )}
                    {ocrResult && (
                        <div className="ocr-result">
                            <h2>📝 OCR Result</h2>
                            <pre>{ocrResult}</pre>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
