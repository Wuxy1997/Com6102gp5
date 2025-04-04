import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full z-50 bg-[#0a192f]/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-[#64ffda] text-xl font-bold">
              Health Tracker
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link to="/dashboard" className="text-gray-300 hover:text-[#64ffda] transition-colors">
              Dashboard
            </Link>
            <Link to="/nutrition" className="text-gray-300 hover:text-[#64ffda] transition-colors">
              Nutrition
            </Link>
            <Link to="/workout" className="text-gray-300 hover:text-[#64ffda] transition-colors">
              Workout Plans
            </Link>
            <Link to="/achievements" className="text-gray-300 hover:text-[#64ffda] transition-colors">
              Achievements
            </Link>
            <Link to="/login" className="text-gray-300 hover:text-[#64ffda] transition-colors">
              Login
            </Link>
            <Link to="/register" 
              className="px-4 py-2 text-sm font-medium rounded-md text-[#0a192f] bg-[#64ffda] hover:bg-[#64ffda]/90 transition-all">
              Register
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-[#64ffda] focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:hidden bg-[#112240] border-t border-[#1d2d50]`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link to="/dashboard" 
            className="block px-3 py-2 text-gray-300 hover:text-[#64ffda] hover:bg-[#1d2d50] rounded-md transition-colors">
            Dashboard
          </Link>
          <Link to="/nutrition" 
            className="block px-3 py-2 text-gray-300 hover:text-[#64ffda] hover:bg-[#1d2d50] rounded-md transition-colors">
            Nutrition
          </Link>
          <Link to="/workout" 
            className="block px-3 py-2 text-gray-300 hover:text-[#64ffda] hover:bg-[#1d2d50] rounded-md transition-colors">
            Workout Plans
          </Link>
          <Link to="/achievements" 
            className="block px-3 py-2 text-gray-300 hover:text-[#64ffda] hover:bg-[#1d2d50] rounded-md transition-colors">
            Achievements
          </Link>
          <Link to="/login" 
            className="block px-3 py-2 text-gray-300 hover:text-[#64ffda] hover:bg-[#1d2d50] rounded-md transition-colors">
            Login
          </Link>
          <Link to="/register" 
            className="block px-3 py-2 text-[#0a192f] bg-[#64ffda] hover:bg-[#64ffda]/90 rounded-md transition-colors">
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 