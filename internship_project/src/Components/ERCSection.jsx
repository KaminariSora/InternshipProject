import '../CSS/ERCSection.css'
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import FileDocument from './icons/FileDocument';
import DownloadIcon from './icons/DownloadIcon';

const WEBHOOK_URL = "https://76c45653f311.ngrok-free.app/webhook/ERC"
// const WEBHOOK_URL = "http://localhost:5678/webhook/ERC"
const ROOT_URL = `http://localhost:5678/webhook/download?path=`

const ERCSection = () => {
    const [searchText, setSearchText] = useState('')
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [filesContent, setFilesCotent] = useState([])

    const handleSubmit = async (e) => {
        e.preventDefault()
        console.log(searchText)
        try {
            setStatus("loading")
            const res = await fetch(WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    searchText,
                }),
            })
            if (!res.ok) {
                setStatus("error")
                console.error(`HTTP Error: ${res.status}`);
                const errText = await res.text();
                console.log("Response text:", errText);
                setError(`Server error: ${res.status}`);
                return;
            }
            const data = await res.json();
            console.log(data)

            const files = Array.isArray(data)
                ? data.map(item => ({
                    path: item.directory,
                    name: item.fileName,
                    size: item.fileSize,
                    status: item.found,
                    seq: item.meeting_seq,
                    summary: Array.isArray(item.summaries) ? item.summaries.join("\n\n") : ""
                }))
                : [];
            setFilesCotent(files)
            setStatus("success")
        } catch (err) {
            const msg = err?.message || "Unknown error";
            setError(msg);
        }
    }

    const handleDownloadClick = (filePath, fileName) => {
        if (!filePath) return;
        const rootUrl = ROOT_URL
        const url = `${rootUrl}${encodeURIComponent(filePath)}/${fileName}`;
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank"
        a.rel = "noopener noreferrer";
        a.click();
    };

    return (
        <div className="content-container">
            <div className="content-header">
                <div className="header-name">
                    <h1>Full Text Search</h1>
                    <p>Internship Project</p>
                </div>
            </div>

            <div className='erc-body'>
                <h1 className='heading'>ERC Document Search</h1>
                <p className='heading'>Search through regulations, policies and official documents</p>
                <div className='erc-input'>
                    <form className="input-form" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Search documents, policies, regulations..."
                            className="message-input"
                            required
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            disabled={status=="loading"}
                        />
                        <button type="submit" aria-label="Send">
                            <FontAwesomeIcon icon={faPaperPlane} size="lg" />
                        </button>
                    </form>
                </div>
                <div className='output-container'>
                    {status === "loading" && <p className='status' style={{ color: "white" }}>Please wait</p>}
                    {status === "idle" && <p className='status' style={{ color: "white" }}>Input searching keywords</p>}
                    {status === "success" && <p className='status' style={{ color: "white" }}>Result</p>}
                    {status === "error" && <p className='status' style={{ color: "red" }}>Error</p>}
                    {filesContent.map((f, i) => (
                        <div key={i} className='card'>
                            <button className='card-download'
                                onClick={() => handleDownloadClick(f.path, f.name)}
                                disabled={!f.path}><DownloadIcon size="1x" /></button>
                            <p className='card-title'><FileDocument size="1x" />{f.name}</p>
                            <p className='card-summary'>{f.summary}</p>
                            {/* <p className='card-content'>Path: {f.path}</p> */}
                            <p className='card-content'>Size: {f.size}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ERCSection;
