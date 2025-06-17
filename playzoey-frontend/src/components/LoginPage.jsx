// LoginPage.js
import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { v1 as uuidv1 } from "uuid";

const LoginPage = ({ 
  setCurrentPage, 
  showNotification, 
  setIsLoading, 
  setIsAuthenticated,
  setUserEmail
}) => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!loginData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(loginData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!loginData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      showNotification("error", "Please fix the form errors");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (data.status === "success") {
        const sessionId = uuidv1();
        sessionStorage.setItem("session_id", sessionId);
        sessionStorage.setItem("isAuthenticated", "true");
        sessionStorage.setItem("userEmail", loginData.email);
        sessionStorage.setItem("user_id", data.user_id);
        sessionStorage.setItem("name", data.name);
        sessionStorage.setItem("age", data.age);

        setIsAuthenticated(true);
        setUserEmail(loginData.email);
        showNotification("success", "Login successful! Redirecting...");
        setTimeout(() => {
          setCurrentPage("chat");
        }, 1500);
      } else {
        showNotification("error", "Invalid email or password");
      }
    } catch (error) {
      console.error("Login failed:", error);
      showNotification("error", "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-r from-lime-400/5 to-green-500/5"></div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
          <button
            onClick={() => setCurrentPage("home")}
            className="flex items-center text-gray-300 hover:text-lime-400 mb-6 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </button>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-400">
              Sign in to access your STRIKIN experience
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => {
                    setLoginData({ ...loginData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:bg-white/10 transition-colors ${
                    errors.email
                      ? "border-red-500 focus:border-red-400"
                      : "border-white/20 focus:border-lime-400"
                  }`}
                  placeholder="Enter your email"
                  required
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginData.password}
                  onChange={(e) => {
                    setLoginData({ ...loginData, password: e.target.value });
                    if (errors.password)
                      setErrors({ ...errors, password: null });
                  }}
                  className={`w-full pl-10 pr-12 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:bg-white/10 transition-colors ${
                    errors.password
                      ? "border-red-500 focus:border-red-400"
                      : "border-white/20 focus:border-lime-400"
                  }`}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-lime-400 text-black py-3 rounded-xl font-semibold hover:bg-lime-300 transition-colors"
            >
              Sign In
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{" "}
              <button
                onClick={() => setCurrentPage("register")}
                className="text-lime-400 hover:text-lime-300 font-semibold"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;