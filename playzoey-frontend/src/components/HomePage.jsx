import React from 'react';
import { MessageCircle, Mail, Phone } from 'lucide-react';

const HomePage = ({ isAuthenticated, setCurrentPage }) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
    <div className="absolute inset-0 bg-gradient-to-r from-lime-400/5 to-green-500/5"></div>

    <div className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
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
            <span>CHAT SUPPORT</span>
          </button>
        </div>

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

export default HomePage;