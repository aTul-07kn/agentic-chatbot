import React, { useState } from 'react';
import { Mail, Lock, User, Phone, Calendar, ArrowLeft, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const AuthApp = () => {
  const [currentPage, setCurrentPage] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notification, setNotification] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

  // Check for existing session on app load
  React.useEffect(() => {
    // In your actual environment, use sessionStorage:
    // const storedAuth = sessionStorage.getItem('isAuthenticated');
    // const storedEmail = sessionStorage.getItem('userEmail');
    
    // For demo purposes, we'll simulate checking sessionStorage
    // In reality, this would restore the actual session
    const storedAuth = false; // sessionStorage.getItem('isAuthenticated') === 'true';
    const storedEmail = ""; // sessionStorage.getItem('userEmail') || "";
    
    if (storedAuth && storedEmail) {
      setIsAuthenticated(true);
      setUserEmail(storedEmail);
      setCurrentPage("chat");
      showNotification('success', `Welcome back, ${storedEmail}!`);
    } else {
      setCurrentPage("home");
    }
    
    setIsInitializing(false);
  }, []);

  // Notification component
  const Notification = ({ type, message, onClose }) => (
    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center gap-2 max-w-sm ${
      type === 'success' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
    }`}>
      {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">×</button>
    </div>
  );

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
      isValid: minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar,
      errors: {
        minLength: !minLength ? "Password must be at least 8 characters" : null,
        hasUppercase: !hasUppercase ? "Password must contain at least 1 uppercase letter" : null,
        hasLowercase: !hasLowercase ? "Password must contain at least 1 lowercase letter" : null,
        hasNumber: !hasNumber ? "Password must contain at least 1 number" : null,
        hasSpecialChar: !hasSpecialChar ? "Password must contain at least 1 special character" : null,
      }
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
        showNotification('error', 'Please fix the form errors');
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch('/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData),
        });

        const data = await response.json();

        if (data.status === 'success') {
          // In your actual environment, use sessionStorage:
          // sessionStorage.setItem('isAuthenticated', 'true');
          // sessionStorage.setItem('userEmail', loginData.email);
          
          // For demo purposes, using React state:
          setIsAuthenticated(true);
          setUserEmail(loginData.email);
          
          showNotification('success', 'Login successful! Redirecting...');
          setTimeout(() => {
            setCurrentPage("chat");
          }, 1500);
        } else {
          showNotification('error', 'Invalid email or password');
        }
      } catch (error) {
        console.error("Login failed:", error);
        showNotification('error', 'Login failed. Please try again.');
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
              <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-gray-400">Sign in to access your STRIKIN experience</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => {
                      setLoginData({ ...loginData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: null });
                    }}
                    className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:bg-white/10 transition-colors ${
                      errors.email ? 'border-red-500 focus:border-red-400' : 'border-white/20 focus:border-lime-400'
                    }`}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) => {
                      setLoginData({ ...loginData, password: e.target.value });
                      if (errors.password) setErrors({ ...errors, password: null });
                    }}
                    className={`w-full pl-10 pr-12 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:bg-white/10 transition-colors ${
                      errors.password ? 'border-red-500 focus:border-red-400' : 'border-white/20 focus:border-lime-400'
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
                {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
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
          const errorMessages = Object.values(passwordValidation.errors).filter(Boolean);
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
        showNotification('error', 'Please fix the form errors');
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch('/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...registerData,
            age: parseInt(registerData.age)
          }),
        });

        const data = await response.json();

        if (data.status === 'success') {
          // In your actual environment, use sessionStorage:
          // sessionStorage.setItem('isAuthenticated', 'true');
          // sessionStorage.setItem('userEmail', registerData.email);
          
          // For demo purposes, using React state:
          setIsAuthenticated(true);
          setUserEmail(registerData.email);
          
          showNotification('success', 'Account created successfully! Redirecting...');
          setTimeout(() => {
            setCurrentPage("chat");
          }, 1500);
        } else {
          showNotification('error', data.reason || 'Registration failed');
        }
      } catch (error) {
        console.error("Registration failed:", error);
        showNotification('error', 'Registration failed. Please try again.');
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
              <h2 className="text-3xl font-bold text-white mb-2">Join STRIKIN</h2>
              <p className="text-gray-400">Create your account to get started</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={registerData.name}
                    onChange={(e) => {
                      setRegisterData({ ...registerData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: null });
                    }}
                    className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:bg-white/10 transition-colors ${
                      errors.name ? 'border-red-500 focus:border-red-400' : 'border-white/20 focus:border-lime-400'
                    }`}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => {
                      setRegisterData({ ...registerData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: null });
                    }}
                    className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:bg-white/10 transition-colors ${
                      errors.email ? 'border-red-500 focus:border-red-400' : 'border-white/20 focus:border-lime-400'
                    }`}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    value={registerData.phone_number}
                    onChange={(e) => {
                      setRegisterData({ ...registerData, phone_number: e.target.value });
                      if (errors.phone_number) setErrors({ ...errors, phone_number: null });
                    }}
                    className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:bg-white/10 transition-colors ${
                      errors.phone_number ? 'border-red-500 focus:border-red-400' : 'border-white/20 focus:border-lime-400'
                    }`}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
                {errors.phone_number && <p className="text-red-400 text-sm mt-1">{errors.phone_number}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Age</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    value={registerData.age}
                    onChange={(e) => {
                      setRegisterData({ ...registerData, age: e.target.value });
                      if (errors.age) setErrors({ ...errors, age: null });
                    }}
                    className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:bg-white/10 transition-colors ${
                      errors.age ? 'border-red-500 focus:border-red-400' : 'border-white/20 focus:border-lime-400'
                    }`}
                    placeholder="Enter your age"
                    min="13"
                    max="120"
                    required
                  />
                </div>
                {errors.age && <p className="text-red-400 text-sm mt-1">{errors.age}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={registerData.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:bg-white/10 transition-colors ${
                      errors.password ? 'border-red-500 focus:border-red-400' : 'border-white/20 focus:border-lime-400'
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
                {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
                {passwordStrength && registerData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-gray-400">Password requirements:</div>
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      <div className={`flex items-center gap-1 ${!passwordStrength.errors.minLength ? 'text-green-400' : 'text-red-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${!passwordStrength.errors.minLength ? 'bg-green-400' : 'bg-red-400'}`} />
                        At least 8 characters
                      </div>
                      <div className={`flex items-center gap-1 ${!passwordStrength.errors.hasUppercase ? 'text-green-400' : 'text-red-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${!passwordStrength.errors.hasUppercase ? 'bg-green-400' : 'bg-red-400'}`} />
                        1 uppercase letter
                      </div>
                      <div className={`flex items-center gap-1 ${!passwordStrength.errors.hasLowercase ? 'text-green-400' : 'text-red-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${!passwordStrength.errors.hasLowercase ? 'bg-green-400' : 'bg-red-400'}`} />
                        1 lowercase letter
                      </div>
                      <div className={`flex items-center gap-1 ${!passwordStrength.errors.hasNumber ? 'text-green-400' : 'text-red-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${!passwordStrength.errors.hasNumber ? 'bg-green-400' : 'bg-red-400'}`} />
                        1 number
                      </div>
                      <div className={`flex items-center gap-1 ${!passwordStrength.errors.hasSpecialChar ? 'text-green-400' : 'text-red-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${!passwordStrength.errors.hasSpecialChar ? 'bg-green-400' : 'bg-red-400'}`} />
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

  const ChatPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Welcome to STRIKIN Chat!</h1>
        <p className="text-gray-400 mb-2">You have successfully logged in.</p>
        {userEmail && <p className="text-lime-400 mb-6">Logged in as: {userEmail}</p>}
        <button
          onClick={() => {
            // In your actual environment:
            // sessionStorage.removeItem('isAuthenticated');
            // sessionStorage.removeItem('userEmail');
            
            setIsAuthenticated(false);
            setUserEmail("");
            setCurrentPage("home");
            showNotification('success', 'Successfully logged out');
          }}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );

  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Welcome to STRIKIN</h1>
        <div className="space-x-4">
          <button
            onClick={() => setCurrentPage("login")}
            className="bg-lime-400 text-black px-6 py-3 rounded-xl font-semibold hover:bg-lime-300 transition-colors"
          >
            Login
          </button>
          <button
            onClick={() => setCurrentPage("register")}
            className="bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors border border-white/20"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      
      {isInitializing ? (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      ) : isAuthenticated ? (
        <ChatPage />
      ) : (
        <>
          {currentPage === "home" && <HomePage />}
          {currentPage === "login" && <LoginPage />}
          {currentPage === "register" && <RegisterPage />}
          {currentPage === "chat" && <ChatPage />}
        </>
      )}
    </div>
  );
};

export default AuthApp;