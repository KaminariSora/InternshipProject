import "../CSS/OCRSection.css";
import FileDocument from "./icons/FileDocument";
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

const WEBHOOK_URL = "http://localhost:5678/webhook/OCR";
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

export default function OCRSection() {
    const fileInputRef = useRef(null);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");
    const [ocrResult, setOcrResult] = useState("");

    const [pdfName, setPdfName] = useState("");
    const [pdfUrl, setPdfUrl] = useState("");
    const [pdfFile, setPdfFile] = useState(null);
    const [numPages, setNumPages] = useState(null);

    const openPicker = () => fileInputRef.current?.click();

    const clearPreview = () => {
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        setPdfUrl("");
        setPdfName("");
        setPdfFile(null);
        setOcrResult("");
    };

    // ล้าง blob url ตอน unmount
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
                <h1>OCR</h1>
                <p>Internship Project</p>
            </div>

            <div className="ocr-body">
                <div className="ocr-bar">
                    <h1>OCR Processing</h1>
                    <p>Upload PDF files to extract text content</p>

                    <div className="upload-box">
                        <FileDocument size="5x" />
                        <h1>Upload a PDF File</h1>
                        <p>Select a PDF file to extract text content</p>

                        <button onClick={openPicker} disabled={status === "uploading"}>
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
                    {pdfUrl && (
                        <div className="pdf-preview">
                            <div className="pdf-preview__header">
                                <strong>{pdfName}</strong>
                            </div>

                            <div className="pdf-viewer">
                                <Document file={pdfUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
                                    {Array.from(new Array(numPages), (el, index) => (
                                        <Page key={`page_${index + 1}`} pageNumber={index + 1} width={800} />
                                    ))}
                                </Document>
                            </div>
                        </div>
                    )}

                    {ocrResult && (
                        <div className="extract-ocr">
                            {/* <h1>Extracted Text</h1> */}
                            <pre>{ocrResult}</pre>
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
        </div>
    );
}