import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import ChatPage from "./components/ChatPage";
import AboutPage from "./components/AboutPage";
import Notification from "./components/Notification";

const StrikinApp = () => {
  const [currentPage, setCurrentPage] = useState("home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const storedAuth = sessionStorage.getItem("isAuthenticated") === "true";
    const storedEmail = sessionStorage.getItem("userEmail") || "";

    if (storedAuth && storedEmail) {
      setIsAuthenticated(true);
      setUserEmail(storedEmail);
      setCurrentPage("chat");
      showNotification("success", `Welcome back, ${storedEmail}!`);
    } else {
      setCurrentPage("home");
    }

    setIsInitializing(false);
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-lime-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isAuthenticated={isAuthenticated}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
      />
      
      {currentPage === "home" && (
        <HomePage 
          isAuthenticated={isAuthenticated} 
          setCurrentPage={setCurrentPage} 
        />
      )}
      
      {currentPage === "login" && (
        <LoginPage 
          setCurrentPage={setCurrentPage} 
          showNotification={showNotification} 
          setIsLoading={setIsLoading}
          setIsAuthenticated={setIsAuthenticated}
          setUserEmail={setUserEmail}
        />
      )}
      
      {currentPage === "register" && (
        <RegisterPage 
          setCurrentPage={setCurrentPage} 
          showNotification={showNotification} 
          setIsLoading={setIsLoading}
          setIsAuthenticated={setIsAuthenticated}
          setUserEmail={setUserEmail}
        />
      )}
      
      {currentPage === "chat" && <ChatPage />}
      {currentPage === "about" && <AboutPage setCurrentPage={setCurrentPage} />}
      
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default StrikinApp;