import "../CSS/OCRSection.css";
import FileDocument from "./icons/FileDocument";
import { useEffect, useRef, useState } from "react";

const WEBHOOK_URL = "http://localhost:5678/webhook/OCR";
const MAX_SIZE = 25 * 1024 * 1024;

export default function OCRSection() {
    const fileInputRef = useRef(null);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");
    const [ocrResult, setOcrResult] = useState("");

    const [pdfName, setPdfName] = useState("");
    const [pdfUrl, setPdfUrl] = useState("");
    const [pdfFile, setPdfFile] = useState(null);
    const [copied, setCopied] = useState(false)

    const openPicker = () => fileInputRef.current?.click();

    const clearPreview = () => {
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        setPdfUrl("");
        setPdfName("");
        setPdfFile(null);
        setOcrResult("");
    };

    useEffect(() => {
        return () => {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        };
    }, [pdfUrl]);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            setStatus("error");
            setMessage("File format must be PDF only.");
            e.target.value = "";
            clearPreview();
            return;
        }
        if (file.size > MAX_SIZE) {
            setStatus("error");
            setMessage("File exceeds maximum allowed size (25MB)");
            e.target.value = "";
            clearPreview();
            return;
        }

        // ✅ สร้างพรีวิวทันที
        clearPreview();
        const objectUrl = URL.createObjectURL(file);
        setPdfUrl(objectUrl);
        setPdfName(file.name);
        setPdfFile(file);

        // เริ่มอัปโหลด
        setStatus("uploading");
        setMessage(`Uploading ${file.name}`);
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
                    ? data[0]?.context ?? data[0]?.json?.context
                    : data?.context ?? data?.result?.context ?? data;

            setOcrResult(String(context ?? "").trim());
            setStatus("success");
            setMessage(`Success`);
        } catch (err) {
            setStatus("error");
            setMessage(`Failed to upload ${err?.message || "Unknown error"}`);
        } finally {
            e.target.value = "";
        }
    };

    return (
        <div className="content-container">
            <div className="content-header">
                <div className="header-name">
                    <h1>OCR</h1>
                    <p>Internship Project</p>
                </div>
            </div>

            <div className="ocr-body">
                <div className="ocr-bar">
                    <h1>OCR Processing</h1>
                    <p>Upload PDF files to extract text content</p>

                    <div className="upload-box">
                        <FileDocument size="5x" />
                        <h1>Upload a PDF File</h1>
                        <p>Select a PDF file to extract text content</p>

                        <button onClick={openPicker} disabled={status === "uploading"} className="button">
                            {status === "uploading" ? "Uploading..." : "Choose File"}
                        </button>

                        {message && (
                            <p style={{ marginTop: 10, color: status === "error" ? "#d32f2f" : "#44e84dff" }}>
                                {message}
                            </p>
                        )}
                    </div>
                </div>
                <div className="ocr-result">
                    <div className="item1">
                        <h1>{pdfName}</h1>
                        <div className="button-set">
                            <button className="button" id="copy"
                                onClick={() => {
                                    navigator.clipboard.writeText(ocrResult);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000)
                                }}
                                disabled={status === "uploading"}
                            >Copy Text</button>
                            <button className="button" id="download"
                                onClick={() => {
                                    const blob = new Blob([ocrResult], { type: "text/plain;charset=utf-8" });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement("a");
                                    link.href = url;
                                    link.download = "ocr_result.txt";
                                    link.click();
                                    URL.revokeObjectURL(url);
                                }}
                                disabled={status === "uploading"}
                            >Download</button>
                        </div>
                    </div>
                    {pdfUrl && (
                        <div className="pdf-viewer item2">
                            <div className="pdf-viewer-heading">
                                <h1>PDF Preview</h1>
                                <a href={pdfUrl} target="_blank" rel="noreferrer">Open in new tab</a>
                            </div>
                            <iframe
                                title="PDF Preview"
                                src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1&zoom=page-width`}
                            />

                        </div>
                    )}

                    {ocrResult && (
                        <div className="extract-ocr item3">
                            <h1>Extracted Text</h1>
                            <div className="ocr-scroll-area">
                                <pre>{ocrResult}</pre>
                            </div>
                        </div>
                    )}
                </div>

                <input
                    type="file"
                    accept="application/pdf"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                />
            </div>
            {copied && <div className="toast">Copied to clipboard</div>}
        </div>
    );
}