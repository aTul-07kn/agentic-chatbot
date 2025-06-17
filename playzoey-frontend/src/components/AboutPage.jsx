import React from 'react';
import { ArrowLeft } from 'lucide-react';

const AboutPage = ({ setCurrentPage }) => (
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

export default AboutPage;