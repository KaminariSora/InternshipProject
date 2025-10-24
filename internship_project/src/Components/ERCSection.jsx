import '../CSS/ERCSection.css'
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";

const WEBHOOK_URL = "http://localhost:5678/webhook-test/ERC"

const ERCSection = () => {
    const [searchText, setSearchText] = useState('')

    async function fetchAndOpenBinary() {
        const res = await fetch(WEBHOOK_URL, {
            method: "POST",                       // หรือ GET ตามที่ตั้ง
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: "คำค้น/พารามิเตอร์" }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // ดึงชื่อไฟล์จาก header ถ้ามี
        const cd = res.headers.get("Content-Disposition"); // e.g. inline; filename="foo.pdf"
        const suggestedName = (cd && /filename\*=UTF-8''([^;]+)|filename="([^"]+)"/i.exec(cd)?.[1] || cd && /filename="([^"]+)"/i.exec(cd)?.[1]) || "file.pdf";

        const blob = await res.blob(); // ได้ไฟล์จริง
        const url = URL.createObjectURL(blob);

        // 1) เปิดในแท็บใหม่ (เหมาะกับ PDF, รูป)
        window.open(url, "_blank", "noopener,noreferrer");

        // หรือ 2) บังคับดาวน์โหลด
        // const a = document.createElement("a");
        // a.href = url;
        // a.download = suggestedName;
        // document.body.appendChild(a);
        // a.click();
        // a.remove();

        // ล้าง URL ชั่วคราวเมื่อไม่ใช้
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    }


    const handleSubmit = (e) => {
        e.preventDefault()
        console.log(searchText)
    }
    // Evernight GIF
    useEffect(() => {
        const oldScript = document.querySelector('script[src="https://tenor.com/embed.js"]');
        if (oldScript) oldScript.remove();

        const script = document.createElement('script');
        script.src = 'https://tenor.com/embed.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);
    // ----------------------------------------------

    return (
        <div className="content-container">
            <div className="content-header">
                <div className="header-name">
                    <h1>Full Text Search</h1>
                    <p>Internship Project</p>
                </div>
            </div>

            <div className='erc-body'>
                <h1>ERC Document Search</h1>
                <p>Search through regulations, policies and official documents</p>
                <div className='erc-input'>
                    <form className="input-form" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Search documents, policies, regulations..."
                            className="message-input"
                            required
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                        <button type="submit" aria-label="Send">
                            <FontAwesomeIcon icon={faPaperPlane} size="lg" />
                        </button>
                    </form>
                    <button onClick={fetchAndOpenBinary}>
                        เปิดไฟล์/ดาวน์โหลด
                    </button>
                </div>
            </div>

            <div className='gif'>
                <div
                    className="tenor-gif-embed"
                    data-postid="8150170169450611599"
                    data-share-method="host"
                    data-aspect-ratio="1.08844"
                    data-width="100%"
                >
                    <a href="https://tenor.com/view/evernight-march-7th-hsr-gif-12239487481756178879">
                        Everknight Evernight GIF
                    </a>
                    from{" "}
                    <a href="https://tenor.com/search/everknight-gifs">Everknight GIFs</a>
                </div>
            </div>
        </div>
    );
}

export default ERCSection;
