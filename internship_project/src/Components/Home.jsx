import '../CSS/Home.css'

const Home = () => {
    return (
        <div className='page'>
            <div className="home-container">
                <div className="section" id='section-1'>
                    <div className='logo'>
                        <img src='./image/Logo.png'></img>
                        <div>
                            <label>ติดบัคหรอ</label>
                            <label>ลองยกมือไหว้ยัง</label>
                        </div>
                    </div>
                    <br></br>
                    <ul>
                        <li className='selected'>AI chat</li>
                        <li>Full Text Search</li>
                        <li>OCR</li>
                    </ul>
                </div>
                <div className="section" id='section-2'>
                    <div className='header'>
                        <h1>AI chat</h1>
                        <p>เจอแต่บัควุ้ย นอยๆๆๆ</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home;