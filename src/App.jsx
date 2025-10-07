import React, { useState, useRef, useEffect } from 'react';

// --- Custom Styles Component for the new Light Theme ---
const CustomStyles = () => (
  <style>{`
    body {
      background-color: #f0f2f5;
      color: #1c1e21;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .chat-window {
      height: 100vh;
      /* background-color: #ffffff; */
      border: none;
      box-shadow: none;
    }
    .user-bubble {
      /* background-image: linear-gradient(to bottom right, #0084ff, #00c6ff); */
      color: #0084ff;
    }
    .assistant-bubble {
      /* background-color: #e4e6eb; */
      color: #1c1e21;
    }
    .btn-primary-custom {
      background-image: linear-gradient(to right, #0084ff, #00c6ff);
      border: none;
      transition: opacity 0.3s ease;
    }
    .btn-primary-custom:hover {
      opacity: 0.9;
    }
    .form-control-custom {
      background-color: #f0f2f5;
      border-color: #ccd0d5;
      color: #1c1e21;
    }
    .form-control-custom::placeholder {
      color: #606770;
    }
    .form-control-custom:focus {
      background-color: #f0f2f5;
      border-color: #0084ff;
      box-shadow: 0 0 0 0.25rem rgba(0, 132, 255, 0.25);
      color: #1c1e21;
    }
    .typing-indicator span {
      height: 8px;
      width: 8px;
      background-color: #606770;
      border-radius: 50%;
      display: inline-block;
      margin: 0 2px;
      animation: bounce 1.4s infinite ease-in-out both;
    }
    .typing-indicator span:nth-of-type(1) {
      animation-delay: -0.32s;
    }
    .typing-indicator span:nth-of-type(2) {
      animation-delay: -0.16s;
    }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1.0); }
    }
  `}</style>
);


// Main App Component
const App = () => {
  // State Management
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi there! How can I help you today?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey] = useState('your google ai studio key'); // Keep your key secure

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Hashing Logic (for text messages) ---
  const calculateHash = async (text) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // --- Main Message Handler ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    
    const prompt = inputValue;
    setInputValue('');
    await handleTextGeneration(prompt);
  };

  // --- Text Generation Logic ---
  const handleTextGeneration = async (prompt) => {
    setIsLoading(true);

    const frontendHash = await calculateHash(prompt);
    console.log("Frontend Hash:", frontendHash);
    const backendCalculatedHash = await calculateHash(prompt);
    if (frontendHash !== backendCalculatedHash) {
      setMessages(prev => [...prev, {role: 'assistant', type: 'text', content: "Data integrity check failed!"}]);
      setIsLoading(false);
      return;
    }

    const apiMessages = messages
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
    apiMessages.push({ role: 'user', parts: [{ text: prompt }]});

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: apiMessages }),
      });
      if (!response.ok) throw new Error((await response.json()).error?.message || "API error.");
      const result = await response.json();
      const botResponseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (botResponseText) {
        setMessages(prev => [...prev, { role: 'assistant', content: botResponseText }]);
      } else { throw new Error("Invalid API response."); }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- Render Components ---
  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100">
       <CustomStyles />
       <div className="w-100 chat-window d-flex flex-column">
        {/* Header */}
        <div className="p-3 border-bottom d-flex align-items-center justify-content-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-3" style={{color: '#0084ff'}}><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/><path d="M12 20a4 4 0 0 0 4-4h-8a4 4 0 0 0 4 4Z"/></svg>
            <h1 className="h4 fw-bold mb-0 text-dark" style={{ justifyContent: 'center', alignItems: 'center' , textAlign: 'center'}}>Shubham AI Assistant</h1>
        </div>

        {/* Chat Messages */}
        <div className="flex-grow-1 p-4 overflow-auto" style={{ margin:'5%'}}>
          <div className="d-flex flex-column gap-3">
            {messages.map((msg, index) => (
              <MessageBubble key={index} role={msg.role} content={msg.content} />
            ))}
            {isLoading && <LoadingBubble />}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Form */}
        <div className="p-3 border-top" style={{ justifyContent: 'end', alignItems: 'center', marginLeft: '40%'}}>
          <form onSubmit={handleSendMessage} className="d-flex align-items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question..."
              className="form-control form-control-custom flex-grow-1 rounded-pill px-3 py-2 me-3"
              style={{ marginLeft:'30%' ,marginRight:'2%',width: '60%', height: '30px', justifyContent: 'center', alignItems: 'center' , textAlign: 'center',margin:'5%', borderRadius: '20px'}}
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !inputValue.trim()} className="btn btn-primary-custom rounded-pill p-0 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px',borderRadius: '20px'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Child Components ---
const MessageBubble = ({ role, content }) => {
  const isUser = role === 'user';
  return (
    <div className={`d-flex ${isUser ? 'justify-content-end' : 'justify-content-start'}`}>
      <div className={`px-4 py-2 rounded-4 ${isUser ? 'user-bubble' : 'assistant-bubble'}`} style={{maxWidth: '90%'}}>
        <p className="mb-0" style={{whiteSpace: 'pre-wrap'}}>{content}</p>
      </div>
    </div>
  );
};

const LoadingBubble = () => (
  <div className="d-flex justify-content-start">
    <div className="assistant-bubble px-4 py-3 rounded-4 d-flex align-items-center">
      <div className="typing-indicator"><span></span><span></span><span></span></div>
    </div>
  </div>
);

export default App;


