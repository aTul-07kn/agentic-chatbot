import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Trophy, MapPin } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const App = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! 👋 I'm your STRIKIN Hyderabad assistant. How can I help you today?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: inputText }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      const botMessage = {
        id: Date.now() + 1,
        text: data.reply,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        isBot: true,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex flex-col">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-emerald-500/20 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-2 rounded-full">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">STRIKIN</h1>
              <p className="text-sm text-emerald-300">
                Sports & Dining Assistant
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-emerald-300">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">Hyderabad</span>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col p-4">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.isBot ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`flex max-w-xs lg:max-w-md ${
                  message.isBot ? "flex-row" : "flex-row-reverse"
                } space-x-2`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.isBot
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                      : "bg-gradient-to-r from-blue-500 to-purple-500"
                  }`}
                >
                  {message.isBot ? (
                    <Bot className="w-4 h-4 text-white" />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    message.isBot
                      ? message.isError
                        ? "bg-red-900/50 border border-red-500/30 text-red-200"
                        : "bg-slate-800/80 border border-emerald-500/30 text-white"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  } backdrop-blur-sm shadow-lg`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.text}
                    </ReactMarkdown>
                  </p>
                  <p className="text-xs opacity-60 mt-1">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-800/80 border border-emerald-500/30 backdrop-blur-sm px-4 py-3 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-slate-800/60 border border-emerald-500/30 rounded-2xl p-3 backdrop-blur-sm">
          <div className="flex space-x-3">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about bookings, facilities, or anything else..."
              className="flex-1 bg-transparent text-white placeholder-slate-400 resize-none outline-none max-h-32"
              rows="1"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputText.trim()}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-600 disabled:to-slate-600 text-white p-2 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-black/20 backdrop-blur-sm border-t border-emerald-500/20 p-3">
        <p className="text-center text-xs text-emerald-300/60">
          STRIKIN Hyderabad - Premium Sports & Dining Experience
        </p>
      </div>
    </div>
  );
};

export default App;
