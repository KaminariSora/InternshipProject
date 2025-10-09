import "../CSS/FormInput.css"
import { useState } from 'react'

// const WEBHOOK_URL = "http://localhost:5678/webhook/React" // deploy-url
const WEBHOOK_URL = "http://localhost:5678/webhook-test/React" // test-url

const FormInput = () => {
    const [value, setValue] = useState("");
    const [status, setStatus] = useState("idle");
    const [response, setResponse] = useState(null);   // เก็บ response จาก n8n
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("loading");
        setResponse(null);
        setError("");

        try {
            const r = await fetch(WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: value }),
            });

            const ctype = r.headers.get("content-type") || "";
            let data;
            if (ctype.includes("application/json")) {
                data = await r.json();
            } else {
                data = { message: await r.text() };
            }

            if (!r.ok) {
                throw new Error(data?.message || `HTTP ${r.status}`);
            }

            setResponse(data);
            setStatus("success");
            setValue("");
        } catch (err) {
            setStatus("error");
            setError(err?.message || "Unknown error");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label htmlFor="inputBox">Input</label>
            <input
                id="inputBox"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="พิมพ์ข้อความที่จะส่งไป n8n"
                required
            />
            <button type="submit" disabled={status === "loading"}>
                {status === "loading" ? "Sending..." : "Submit"}
            </button>

            {status === "success" && (
                <div className="ok">
                    {/* <h4>ผลลัพธ์จาก n8n</h4> */}
                    {/* <pre>{JSON.stringify(response, null, 2)}</pre> */}
                    {/* ถ้ารู้โครงสร้างแน่นอน ก็แสดงเฉพาะ field ได้เลย เช่น: */}
                    <p>{response.message}</p>
                </div>
            )}

            {status === "error" && <p className="err">✖ {error}</p>}
        </form>
    )
}

export default FormInput