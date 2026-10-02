import React, { useState, useRef, useEffect } from "react";
import "./Chatbot.css";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm your eco-assistant. How can I help you today?",
      isBot: true,
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = inputValue.trim();
    const newMessages = [...messages, { text: userMsg, isBot: false }];
    setMessages(newMessages);
    setInputValue("");

    // Add a "typing" indicator
    setMessages((prev) => [
      ...prev,
      { text: "...", isBot: true, isTyping: true },
    ]);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5001"}/api/chatbot`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: userMsg,
            history: messages.slice(-5), // Send last 5 messages for context
          }),
        },
      );

      const data = await response.json();

      // Remove typing indicator and add real response
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isTyping);
        if (data.success) {
          return [...filtered, { text: data.data.text, isBot: true }];
        } else {
          return [
            ...filtered,
            {
              text: "I'm having trouble connecting to my brain. Try again later!",
              isBot: true,
            },
          ];
        }
      });
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev.filter((m) => !m.isTyping),
        {
          text: "I'm offline right now. Check your internet connection!",
          isBot: true,
        },
      ]);
    }
  };

  return (
    <div className="chatbot-container">
      {isOpen && (
        <section
          className="chatbot-window"
          aria-label="Nexora RAG eco assistant"
          aria-live="polite"
        >
          <header className="chatbot-header">
            <div className="chatbot-brand">
              <span className="chatbot-mascot" aria-hidden="true">
                <span className="chatbot-mascot__leaf">🌱</span>
                <span className="chatbot-mascot__face">•ᴗ•</span>
              </span>
              <div>
                <h2>Eco Assistant</h2>
                <p>
                  <span className="chatbot-status-dot" /> Your green guide
                </p>
              </div>
            </div>
            <button
              className="chatbot-close"
              type="button"
              onClick={toggleChat}
              aria-label="Close eco assistant"
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <div className="chatbot-welcome" aria-hidden="true">
            <span className="chatbot-welcome__spark">✦</span>
            <span>Curious about the planet? Ask away.</span>
          </div>

          <div
            className="chatbot-messages"
            role="log"
            aria-label="Chat messages"
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message-wrapper ${msg.isBot ? "bot" : "user"}`}
              >
                {msg.isBot && (
                  <span className="chatbot-message-avatar" aria-hidden="true">
                    🌱
                  </span>
                )}
                <div
                  className={`message-bubble ${msg.isBot ? "bot-bubble" : "user-bubble"}`}
                >
                  {msg.isTyping ? (
                    <span
                      className="chatbot-typing"
                      aria-label="Assistant is typing"
                    >
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input-form" onSubmit={handleSend}>
            <label className="chatbot-sr-only" htmlFor="eco-assistant-input">
              Message the eco assistant
            </label>
            <input
              id="eco-assistant-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about the environment..."
              className="chatbot-input"
            />
            <button
              type="submit"
              className="chatbot-send"
              aria-label="Send message"
              disabled={!inputValue.trim()}
            >
              <span aria-hidden="true">↑</span>
            </button>
          </form>
          <p className="chatbot-footer-note">
            Learn something. Leave a lighter footprint.
          </p>
        </section>
      )}

      {!isOpen && (
        <button
          className="chatbot-toggle-btn"
          type="button"
          onClick={toggleChat}
          title="Open eco assistant"
          aria-label="Open eco assistant"
          aria-expanded={isOpen}
        >
          <span className="chatbot-toggle-mascot" aria-hidden="true">
            🌱
          </span>
          <span>Ask Eco</span>
        </button>
      )}
    </div>
  );
};

export default Chatbot;
