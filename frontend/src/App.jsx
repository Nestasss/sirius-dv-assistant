import React, { useState, useRef, useEffect } from 'react';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('search');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Привет! 👋 Я AI-ассистент SiriusDV. Помогу вам найти идеальный автомобиль из Японии или Кореи. Что вы ищите?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: inputValue
    };
    setMessages([...messages, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('https://notificbot.ru/webhook/sirius-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          user_id: 'web_user_' + Date.now()
        })
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage = {
          id: messages.length + 2,
          type: 'bot',
          text: data.message || data || 'Ошибка: пустой ответ'
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <img 
              src="https://static.tildacdn.com/tild3866-3963-4135-b464-386261663030/Vector.svg" 
              alt="SiriusDV Logo" 
              className="logo-image"
            />
            <div className="logo-text">
              <h1>SiriusDV</h1>
              <p className="tagline">Поиск авто из Японии и Кореи</p>
            </div>
          </div>
        </div>
      </header>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          💬 Ассистент
        </button>
        <button 
          className={`tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          ℹ️ Информация
        </button>
      </div>

      <div className="content">
        {activeTab === 'search' && (
          <div className="chat-container">
            <div className="messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`message message-${msg.type}`}>
                  <div className="message-content">
                    {msg.type === 'bot' && <span className="bot-icon">🤖</span>}
                    {msg.type === 'user' && <span className="user-icon">👤</span>}
                    <p>{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className="input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Напишите, какое авто ищите..."
                disabled={loading}
              />
              <button type="submit" disabled={loading || !inputValue.trim()}>
                {loading ? '⏳' : '✉️'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="info-container">
            <h2>О компании SiriusDV</h2>
            <p>SiriusDV - компания с опытом 15+ лет в поиске и доставке автомобилей из Японии и Кореи в Россию.</p>
            <h3>Контакты</h3>
            <p>📱 8 800 101 50 86<br/>📧 manager@sirius.ru</p>
          </div>
        )}
      </div>
    </div>
  );
}
