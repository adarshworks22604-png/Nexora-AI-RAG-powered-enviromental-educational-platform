import { useState, useRef, useEffect } from "react";
import "./Chatbot.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! Main Nexora ka assistant hoon. Points, tasks, quizzes ya kisi bhi cheez ke baare me pooch sakte ho.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage = { role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.reply || "Sorry, kuch gadbad ho gayi." },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Server se connect nahi ho pa raha. Backend chal raha hai check karo.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chatbot-container">
      {isOpen && (
        <section className="chatbot-window" aria-label="Nexora eco assistant">
          <header className="chatbot-header">
            <div className="chatbot-brand">
              <span className="chatbot-mascot" aria-hidden="true">
                <span className="chatbot-mascot__leaf">🌱</span>
                <span className="chatbot-mascot__face">•ᴗ•</span>
              </span>
              <div>
                <h2>Nexora Assistant</h2>
                <p>
                  <span className="chatbot-status-dot" /> Here to help you grow
                </p>
              </div>
            </div>
            <button
              className="chatbot-close"
              type="button"
              aria-label="Close Nexora assistant"
              onClick={() => setIsOpen(false)}
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <div className="chatbot-welcome" aria-hidden="true">
            <span className="chatbot-welcome__spark">✦</span>
            <span>Your friendly guide to greener choices.</span>
          </div>

          <div
            className="chatbot-messages"
            role="log"
            aria-label="Chat messages"
            ref={scrollRef}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`message-wrapper ${m.role === "user" ? "user" : "bot"}`}
              >
                {m.role !== "user" && (
                  <span className="chatbot-message-avatar" aria-hidden="true">
                    🌱
                  </span>
                )}
                <div
                  className={`message-bubble ${m.role === "user" ? "user-bubble" : "bot-bubble"}`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="message-wrapper bot">
                <span className="chatbot-message-avatar" aria-hidden="true">
                  🌱
                </span>
                <div className="message-bubble bot-bubble">
                  <span
                    className="chatbot-typing"
                    aria-label="Assistant is typing"
                  >
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="chatbot-input-form">
            <label className="chatbot-sr-only" htmlFor="nexora-chat-input">
              Message Nexora assistant
            </label>
            <textarea
              id="nexora-chat-input"
              className="chatbot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Apna sawaal likho..."
              rows={1}
            />
            <button
              className="chatbot-send"
              type="button"
              aria-label="Send message"
              onClick={handleSend}
              disabled={loading}
            >
              <span aria-hidden="true">↑</span>
            </button>
          </div>
          <p className="chatbot-footer-note">
            Ask a question. Discover a better habit.
          </p>
        </section>
      )}

      <button
        className="chatbot-toggle-btn"
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Close Nexora assistant" : "Open Nexora assistant"}
        aria-expanded={isOpen}
      >
        <span className="chatbot-toggle-mascot" aria-hidden="true">
          {isOpen ? "×" : "🌱"}
        </span>
        <span>{isOpen ? "Close" : "Ask Eco"}</span>
      </button>
    </div>
  );
}
