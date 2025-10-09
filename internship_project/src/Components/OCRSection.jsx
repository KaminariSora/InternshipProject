import '../CSS/OCRSection.css'
import FileDocument from './icons/FileDocument'

const OCRSection = () => {
    return (
        <div className="content-container">
            <div className="content-header">
                <h1>OCR</h1>
                <p>Internship Project</p>
            </div>
            <div className="ocr-body">
                <div className='ocr-center'>
                    <FileDocument/>
                    <h1>Upload a PDF File</h1>
                    <p>Select a PDF file to extract text content</p>
                    <button>Choose PDF File</button>
                </div>
            </div>
        </div>
    )
}

export default OCRSection