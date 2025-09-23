import '../CSS/Home.css'

const Home = () => {
    return (
        <div className='page'>
            <header>Hello</header>
            <div className="home-container">
                <div className="section" id='section-1'>
                    <ul>
                        <li className='selected'>AI chat</li>
                        <li>Full Text Search</li>
                        <li>OCR</li>
                    </ul>
                </div>
                <div className="section">section2</div>
                <div className="section">section3</div>
            </div>
            <footer>Footer</footer>
        </div>
    )
}

export default Home;