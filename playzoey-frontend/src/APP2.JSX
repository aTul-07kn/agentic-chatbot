import React, { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Send,
  User,
  Lock,
  Mail,
  Phone,
  Calendar,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";

import ReactMarkdown from "react-markdown";

const StrikinApp = () => {
  const [currentPage, setCurrentPage] = useState("home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  // Notification component
  const Notification = ({ type, message, onClose }) => (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center gap-2 max-w-sm ${
        type === "success"
          ? "bg-green-500/90 text-white"
          : "bg-red-500/90 text-white"
      }`}
    >
      {type === "success" ? (
        <CheckCircle size={20} />
      ) : (
        <AlertCircle size={20} />
      )}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        ×
      </button>
    </div>
  );

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

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid:
        minLength &&
        hasUppercase &&
        hasLowercase &&
        hasNumber &&
        hasSpecialChar,
      errors: {
        minLength: !minLength ? "Password must be at least 8 characters" : null,
        hasUppercase: !hasUppercase
          ? "Password must contain at least 1 uppercase letter"
          : null,
        hasLowercase: !hasLowercase
          ? "Password must contain at least 1 lowercase letter"
          : null,
        hasNumber: !hasNumber
          ? "Password must contain at least 1 number"
          : null,
        hasSpecialChar: !hasSpecialChar
          ? "Password must contain at least 1 special character"
          : null,
      },
    };
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    return phoneRegex.test(phone);
  };

  const validateAge = (age) => {
    const ageNum = parseInt(age);
    return ageNum >= 13 && ageNum <= 120;
  };

  // Header Component
  const Header = () => (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => setCurrentPage("home")}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-lime-400 to-green-500 rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-sm">S</span>
            </div>
            <span className="text-white text-xl font-bold tracking-wider">
              STRIKIN
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => setCurrentPage("home")}
              className="text-white hover:text-lime-400 transition-colors"
            >
              ATTRACTIONS
            </button>
            <button
              onClick={() => setCurrentPage("about")}
              className="text-white hover:text-lime-400 transition-colors"
            >
              ABOUT US
            </button>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => setCurrentPage("login")}
                  className="text-white hover:text-lime-400 transition-colors"
                >
                  LOGIN
                </button>
                <button
                  onClick={() => setCurrentPage("register")}
                  className="bg-lime-400 text-black px-6 py-2 rounded-full font-semibold hover:bg-lime-300 transition-colors"
                >
                  SING UP
                </button>
              </>
            ) : (
              <button
                onClick={() => setCurrentPage("chat")}
                className="bg-lime-400 text-black px-6 py-2 rounded-full font-semibold hover:bg-lime-300 transition-colors flex items-center space-x-2"
              >
                <MessageCircle size={16} />
                <span>CHAT</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {showMobileMenu && (
        <div className="md:hidden bg-black/90 backdrop-blur-md border-t border-white/10">
          <div className="px-4 py-4 space-y-4">
            <button
              onClick={() => {
                setCurrentPage("home");
                setShowMobileMenu(false);
              }}
              className="block text-white hover:text-lime-400 transition-colors"
            >
              ATTRACTIONS
            </button>
            <button
              onClick={() => {
                setCurrentPage("about");
                setShowMobileMenu(false);
              }}
              className="block text-white hover:text-lime-400 transition-colors"
            >
              ABOUT US
            </button>
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    setCurrentPage("login");
                    setShowMobileMenu(false);
                  }}
                  className="block text-white hover:text-lime-400 transition-colors"
                >
                  LOGIN
                </button>
                <button
                  onClick={() => {
                    setCurrentPage("register");
                    setShowMobileMenu(false);
                  }}
                  className="block bg-lime-400 text-black px-4 py-2 rounded-full font-semibold hover:bg-lime-300 transition-colors text-center"
                >
                  SIGN UP
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setCurrentPage("chat");
                  setShowMobileMenu(false);
                }}
                className="block bg-lime-400 text-black px-4 py-2 rounded-full font-semibold hover:bg-lime-300 transition-colors text-center"
              >
                CHAT
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );

  // Home Page
  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="absolute inset-0 bg-gradient-to-r from-lime-400/5 to-green-500/5"></div>

      <div className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              WE'D LOVE TO <span className="text-lime-400">HEAR</span>
              <br />
              FROM <span className="text-lime-400">YOU</span>
            </h1>
            <p className="text-xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Have questions or want to plan your visit? Reach out to the
              Strikin team for bookings, events, or anything else. Let's make
              your experience unforgettable!
            </p>
            <button
              onClick={() =>
                isAuthenticated
                  ? setCurrentPage("chat")
                  : setCurrentPage("login")
              }
              className="bg-lime-400 text-black px-8 py-4 rounded-full text-lg font-semibold hover:bg-lime-300 transition-colors inline-flex items-center space-x-2"
            >
              <MessageCircle size={20} />
              <span>GET IN TOUCH</span>
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-colors">
              <h3 className="text-xl font-bold text-white mb-4">
                Tech-Powered Sports
              </h3>
              <p className="text-gray-300">
                Experience cricket and golf bays that respond to every swing
                with cutting-edge technology.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-colors">
              <h3 className="text-xl font-bold text-white mb-4">
                Immersive Entertainment
              </h3>
              <p className="text-gray-300">
                Step into our VVIP rooms and mega-screen experiences that
                transport you to other worlds.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-colors">
              <h3 className="text-xl font-bold text-white mb-4">
                Elevated Dining
              </h3>
              <p className="text-gray-300">
                Discover theatrical plating and immersive dining rooms with
                menus that surprise at every turn.
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-lime-400 mb-6 text-center">
                Get In Touch
              </h3>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-lime-400/20 rounded-full flex items-center justify-center">
                    <Mail className="text-lime-400" size={20} />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Email</h4>
                    <p className="text-gray-300">hello@strikin.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-lime-400/20 rounded-full flex items-center justify-center">
                    <Phone className="text-lime-400" size={20} />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Phone</h4>
                    <p className="text-gray-300">+919032111833</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-lime-400 mb-6 text-center">
                Visit Us
              </h3>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-lime-400/20 rounded-full flex items-center justify-center mt-1">
                  <div className="w-3 h-3 bg-lime-400 rounded-full"></div>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">Location</h4>
                  <p className="text-gray-300 leading-relaxed">
                    1st Floor, Manasu Building
                    <br />
                    Plot 198, RBI Colony
                    <br />
                    Phase 2, Kavuri Hills
                    <br />
                    Madhapur, Hyderabad
                    <br />
                    Telangana 500081
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-4">Quick Links</h3>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <button className="text-gray-300 hover:text-lime-400 transition-colors">
                  FAQs
                </button>
                <span className="text-gray-600">•</span>
                <button className="text-gray-300 hover:text-lime-400 transition-colors">
                  Privacy Policy
                </button>
                <span className="text-gray-600">•</span>
                <button className="text-gray-300 hover:text-lime-400 transition-colors">
                  Terms of Service
                </button>
                <span className="text-gray-600">•</span>
                <button className="text-gray-300 hover:text-lime-400 transition-colors">
                  Cookie Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Login Page
  const LoginPage = () => {
    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});

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
          // In your actual environment, use sessionStorage:
          sessionStorage.setItem("isAuthenticated", "true");
          sessionStorage.setItem("userEmail", loginData.email);

          // For demo purposes, using React state:
          setIsAuthenticated(true);

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
                disabled={isLoading}
                className="w-full bg-lime-400 text-black py-3 rounded-xl font-semibold hover:bg-lime-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing In..." : "Sign In"}
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

  // Register Page
  const RegisterPage = () => {
    const [registerData, setRegisterData] = useState({
      name: "",
      email: "",
      phone_number: "",
      age: "",
      password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState(null);

    const validateForm = () => {
      const newErrors = {};

      if (!registerData.name.trim()) {
        newErrors.name = "Name is required";
      } else if (registerData.name.trim().length < 2) {
        newErrors.name = "Name must be at least 2 characters";
      }

      if (!registerData.email) {
        newErrors.email = "Email is required";
      } else if (!validateEmail(registerData.email)) {
        newErrors.email = "Please enter a valid email address";
      }

      if (!registerData.phone_number) {
        newErrors.phone_number = "Phone number is required";
      } else if (!validatePhone(registerData.phone_number)) {
        newErrors.phone_number = "Please enter a valid phone number";
      }

      if (!registerData.age) {
        newErrors.age = "Age is required";
      } else if (!validateAge(registerData.age)) {
        newErrors.age = "Age must be between 13 and 120";
      }

      if (!registerData.password) {
        newErrors.password = "Password is required";
      } else {
        const passwordValidation = validatePassword(registerData.password);
        if (!passwordValidation.isValid) {
          const errorMessages = Object.values(passwordValidation.errors).filter(
            Boolean
          );
          newErrors.password = errorMessages[0];
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handlePasswordChange = (password) => {
      setRegisterData({ ...registerData, password });
      if (password) {
        setPasswordStrength(validatePassword(password));
      } else {
        setPasswordStrength(null);
      }
      if (errors.password) setErrors({ ...errors, password: null });
    };

    const handleRegister = async () => {
      if (!validateForm()) {
        showNotification("error", "Please fix the form errors");
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch("http://localhost:8000/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...registerData,
            age: parseInt(registerData.age),
          }),
        });

        const data = await response.json();

        if (data.status === "success") {
          // In your actual environment, use sessionStorage:
          sessionStorage.setItem("isAuthenticated", "true");
          sessionStorage.setItem("userEmail", registerData.email);

          // For demo purposes, using React state:
          setIsAuthenticated(true);

          showNotification(
            "success",
            "Account created successfully! Redirecting..."
          );
          setTimeout(() => {
            setCurrentPage("chat");
          }, 1500);
        } else {
          showNotification("error", data.reason || "Registration failed");
        }
      } catch (error) {
        console.error("Registration failed:", error);
        showNotification("error", "Registration failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-4 py-8">
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
                Join STRIKIN
              </h2>
              <p className="text-gray-400">
                Create your account to get started
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={registerData.name}
                    onChange={(e) => {
                      setRegisterData({
                        ...registerData,
                        name: e.target.value,
                      });
                      if (errors.name) setErrors({ ...errors, name: null });
                    }}
                    className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:bg-white/10 transition-colors ${
                      errors.name
                        ? "border-red-500 focus:border-red-400"
                        : "border-white/20 focus:border-lime-400"
                    }`}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                )}
              </div>

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
                    value={registerData.email}
                    onChange={(e) => {
                      setRegisterData({
                        ...registerData,
                        email: e.target.value,
                      });
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
                  Phone Number
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="tel"
                    value={registerData.phone_number}
                    onChange={(e) => {
                      setRegisterData({
                        ...registerData,
                        phone_number: e.target.value,
                      });
                      if (errors.phone_number)
                        setErrors({ ...errors, phone_number: null });
                    }}
                    className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:bg-white/10 transition-colors ${
                      errors.phone_number
                        ? "border-red-500 focus:border-red-400"
                        : "border-white/20 focus:border-lime-400"
                    }`}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
                {errors.phone_number && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.phone_number}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Age
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="number"
                    value={registerData.age}
                    onChange={(e) => {
                      setRegisterData({ ...registerData, age: e.target.value });
                      if (errors.age) setErrors({ ...errors, age: null });
                    }}
                    className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:bg-white/10 transition-colors ${
                      errors.age
                        ? "border-red-500 focus:border-red-400"
                        : "border-white/20 focus:border-lime-400"
                    }`}
                    placeholder="Enter your age"
                    min="13"
                    max="120"
                    required
                  />
                </div>
                {errors.age && (
                  <p className="text-red-400 text-sm mt-1">{errors.age}</p>
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
                    value={registerData.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:bg-white/10 transition-colors ${
                      errors.password
                        ? "border-red-500 focus:border-red-400"
                        : "border-white/20 focus:border-lime-400"
                    }`}
                    placeholder="Create a password"
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
                {passwordStrength && registerData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-gray-400">
                      Password requirements:
                    </div>
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      <div
                        className={`flex items-center gap-1 ${
                          !passwordStrength.errors.minLength
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            !passwordStrength.errors.minLength
                              ? "bg-green-400"
                              : "bg-red-400"
                          }`}
                        />
                        At least 8 characters
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          !passwordStrength.errors.hasUppercase
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            !passwordStrength.errors.hasUppercase
                              ? "bg-green-400"
                              : "bg-red-400"
                          }`}
                        />
                        1 uppercase letter
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          !passwordStrength.errors.hasLowercase
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            !passwordStrength.errors.hasLowercase
                              ? "bg-green-400"
                              : "bg-red-400"
                          }`}
                        />
                        1 lowercase letter
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          !passwordStrength.errors.hasNumber
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            !passwordStrength.errors.hasNumber
                              ? "bg-green-400"
                              : "bg-red-400"
                          }`}
                        />
                        1 number
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          !passwordStrength.errors.hasSpecialChar
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            !passwordStrength.errors.hasSpecialChar
                              ? "bg-green-400"
                              : "bg-red-400"
                          }`}
                        />
                        1 special character
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleRegister}
                disabled={isLoading}
                className="w-full bg-lime-400 text-black py-3 rounded-xl font-semibold hover:bg-lime-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Already have an account?{" "}
                <button
                  onClick={() => setCurrentPage("login")}
                  className="text-lime-400 hover:text-lime-300 font-semibold"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ChatPage = () => {
    // Chat states with enhanced functionality
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
    const [currentPage, setCurrentPage] = useState("chat");
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
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <div className="absolute inset-0 bg-gradient-to-r from-lime-400/5 to-green-500/5"></div>

        <div className="relative pt-20 pb-4 px-4 h-screen flex flex-col">
          <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="bg-white/10 backdrop-blur-md rounded-t-2xl p-6 border-b border-white/10">
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
                    sessionStorage.clear(); // Clear all session data
                    window.location.reload(); // Refresh the page
                  }}
                  className="text-gray-300 hover:text-red-400 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={24} />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 bg-white/5 backdrop-blur-md p-6 overflow-y-auto">
              <div className="space-y-6">
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
                          {message.text}
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
              </div>
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white/10 backdrop-blur-md rounded-b-2xl p-6 border-t border-white/10">
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
                    onInput={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height =
                        Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim() || isLoading}
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

  // About Page
  const AboutPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="absolute inset-0 bg-gradient-to-r from-lime-400/5 to-green-500/5"></div>

      <div className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setCurrentPage("home")}
            className="flex items-center text-gray-300 hover:text-lime-400 mb-8 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </button>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <h1 className="text-4xl font-bold text-white mb-8 text-center">
              Welcome to <span className="text-lime-400">STRIKIN</span>
            </h1>

            <div className="space-y-8 text-gray-300 leading-relaxed">
              <div>
                <h2 className="text-2xl font-bold text-lime-400 mb-4">
                  Where Every Moment Is an Expedition
                </h2>
                <p className="text-lg">
                  STRIKIN is India's next-generation hub for tech-powered sport,
                  immersive entertainment, rooftop dining and elevated social
                  energy.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-lime-400 mb-4">
                  Redefining the Rules of Play
                </h2>
                <p className="text-lg">
                  Based in Hyderabad, STRIKIN is where tech meets touch. Where
                  cricket and golf bays respond to every swing, and immersive
                  VVIP rooms transport you to other worlds, where mega-screens
                  bring the biggest matches and moments to life.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-lime-400 mb-4">
                  Elevated Dining Experience
                </h2>
                <p className="text-lg">
                  Dining is anything but ordinary - think theatrical plating,
                  immersive rooms, and menus that surprise at every turn.
                  Everything, from the soundscape to the seating, is built to
                  pull you into the experience.
                </p>
              </div>

              <div className="bg-lime-400/10 rounded-xl p-6 border border-lime-400/20">
                <p className="text-lime-400 font-semibold text-center text-lg">
                  Experience the future of entertainment, sports, and dining at
                  STRIKIN - where every visit becomes an unforgettable
                  expedition.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Header />

      {currentPage === "home" && <HomePage />}
      {currentPage === "login" && <LoginPage />}
      {currentPage === "register" && <RegisterPage />}
      {currentPage === "chat" && <ChatPage />}
      {currentPage === "about" && <AboutPage />}
    </div>
  );
};

export default StrikinApp;