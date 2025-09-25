import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import '../CSS/ChatSection.css'

const ChatSection = () => {
    return (
        <div className="chat-container">
            <div className="chat-header">
                <h1>AI chat</h1>
                <p>Energy Regulatory Commission</p>
            </div>
            <div className="chat-body">
                <div className="message bot-message">
                    <p className="message-text">HelloWorld</p>
                </div>
                <div className="message user-message">
                    <p className="message-text">User message</p>
                </div>
            </div>
            <div className="chat-footer">
                <form action="#" className="chat-form">
                    <input type="text" placeholder="input" className="message-input" required></input>
                    <button><FontAwesomeIcon icon={faPaperPlane}
                        size="4X" /></button>
                </form>
            </div>
        </div>
    )
}

export default ChatSection