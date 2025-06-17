// ChatPage.js
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const hasSentInitialGreeting = useRef(false); // Add this ref

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send initial greeting ONLY once on component mount
  useEffect(() => {
    if (hasSentInitialGreeting.current) return; // Prevent duplicate calls
    
    const fetchInitialGreeting = async () => {
      setIsLoading(true);
      try {
        const userDetails = {
          email: sessionStorage.getItem("userEmail") || "",
          user_id: sessionStorage.getItem("user_id") || "",
          name: sessionStorage.getItem("name") || "",
          age: sessionStorage.getItem("age") || "",
        };

        const response = await fetch("http://localhost:8000/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // message: `Hi, my user details are: ${JSON.stringify(userDetails)}`,
            message: `Hi`,
            email: sessionStorage.getItem("userEmail") || "",
            session_id: sessionStorage.getItem("session_id") || "",
          }),
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();

        const welcomeMessage = {
          id: Date.now(),
          text: data.reply,
          isBot: true,
          timestamp: new Date(),
        };

        setMessages([welcomeMessage]);
        hasSentInitialGreeting.current = true; // Mark as sent
      } catch (error) {
        const errorMessage = {
          id: Date.now(),
          text: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
          isBot: true,
          timestamp: new Date(),
        };
        setMessages([errorMessage]);
        hasSentInitialGreeting.current = true; // Mark as sent even on error
      } finally {
        setIsLoading(false);
        setIsInitializing(false);
      }
    };

    fetchInitialGreeting();
  }, []); // Empty dependency array ensures it runs only once on mount

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
        body: JSON.stringify({
          message: inputText,
          email: sessionStorage.getItem("userEmail") || "",
          session_id: sessionStorage.getItem("session_id") || "",
        }),
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
        isError: true,
        timestamp: new Date(),
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
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="absolute inset-0 bg-gradient-to-r from-lime-400/5 to-green-500/5"></div>

      <div className="relative pt-20 pb-4 px-4 h-screen flex flex-col">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex-shrink-0 bg-white/10 backdrop-blur-md rounded-t-2xl p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  STRIKIN Assistant
                </h1>
                <p className="text-gray-300">
                  Your guide to tech-powered experiences
                </p>
              </div>
              <button
                onClick={() => {
                  sessionStorage.clear();
                  window.location.reload();
                }}
                className="text-gray-300 hover:text-red-400 transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={24} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Chat Messages Container */}
          <div 
            ref={chatContainerRef}
            className="flex-1 min-h-0 overflow-y-auto bg-white/5 backdrop-blur-md p-6"
          >
            <div className="space-y-6">
              {isInitializing ? (
                <div className="flex justify-center items-center h-full">
                  <div className="flex flex-col items-center">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-lime-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-3 h-3 bg-lime-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-3 h-3 bg-lime-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-gray-400 mt-4">
                      Setting up your assistant...
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.isBot ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div className="flex flex-col max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl">
                        <div
                          className={`rounded-2xl p-4 ${
                            message.isBot
                              ? message.isError
                                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                : "bg-white/10 text-white border border-white/20"
                              : "bg-lime-400 text-black"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            <ReactMarkdown>
                              {message.text}
                            </ReactMarkdown>
                          </p>
                        </div>
                        <span
                          className={`text-xs text-gray-400 mt-1 ${
                            message.isBot ? "text-left" : "text-right"
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex flex-col max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl">
                        <div className="bg-white/10 text-white border border-white/20 rounded-2xl p-4">
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-lime-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-lime-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-lime-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 mt-1 text-left">
                          Typing...
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 bg-white/10 backdrop-blur-md rounded-b-2xl p-6 border-t border-white/10">
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about bookings, events, or STRIKIN experiences..."
                  className="w-full bg-white/5 border border-white/20 rounded-xl p-4 text-white placeholder-gray-400 focus:outline-none focus:border-lime-400 focus:bg-white/10 transition-colors resize-none overflow-hidden"
                  rows="2"
                  style={{ minHeight: "60px", maxHeight: "120px" }}
                  disabled={isInitializing}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height =
                      Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || isLoading || isInitializing}
                className="bg-lime-400 text-black p-4 rounded-xl hover:bg-lime-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
                style={{ height: "60px", width: "60px" }}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;