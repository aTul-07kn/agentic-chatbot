import React from 'react';
import { 
  MessageCircle, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Calendar, 
  ArrowLeft, 
  Menu, 
  X 
} from 'lucide-react';

const Header = ({ 
  currentPage, 
  setCurrentPage, 
  isAuthenticated, 
  showMobileMenu, 
  setShowMobileMenu 
}) => (
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
                SIGN UP
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

        <button
          className="md:hidden text-white"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </div>

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

export default Header;