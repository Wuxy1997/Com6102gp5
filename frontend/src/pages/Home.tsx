import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import heroImage from '../assets/hero.png';
import feature1 from '../assets/feature1.png';
import feature2 from '../assets/feature2.png';
import feature3 from '../assets/feature3.png';
import ctaImage from '../assets/feature4.png';

const Home: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [activePage, setActivePage] = useState(0);
  const [isScrollLocked, setIsScrollLocked] = useState(false);

  // Scroll handler with lock
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    if (isScrollLocked) return;
    
    const direction = e.deltaY > 0 ? 1 : -1;
    const nextPage = Math.max(0, Math.min(2, activePage + direction));
    
    if (nextPage !== activePage) {
      setIsScrollLocked(true);
      setActivePage(nextPage);
      containerRef.current?.scrollTo({
        top: window.innerHeight * nextPage,
        behavior: 'smooth'
      });
      
      // Unlock scroll after 500ms
      setTimeout(() => {
        setIsScrollLocked(false);
      }, 500);
    }
  }, [activePage, isScrollLocked]);

  // Page navigation with lock
  const scrollToPage = useCallback((index: number) => {
    if (isScrollLocked) return;
    
    setIsScrollLocked(true);
    setActivePage(index);
    containerRef.current?.scrollTo({
      top: window.innerHeight * index,
      behavior: 'smooth'
    });
    
    // Unlock scroll after 500ms
    setTimeout(() => {
      setIsScrollLocked(false);
    }, 500);
  }, [isScrollLocked]);

  // Add custom scroll behavior
  useEffect(() => {
    // Add global styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      .scroll-container {
        scroll-behavior: smooth !important;
        transition-duration: 800ms !important;
        transition-timing-function: cubic-bezier(0.45, 0, 0.55, 1) !important;
      }
      
      .scroll-container::-webkit-scrollbar {
        width: 0;
        background: transparent;
      }
    `;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Handle wheel events
  useEffect(() => {
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      handleWheel(e);
    };
    
    window.addEventListener('wheel', wheelHandler, { passive: false });
    return () => window.removeEventListener('wheel', wheelHandler);
  }, [handleWheel]);

  const features = [
    {
      title: "Track Your Health Data",
      description: "Record and analyze key health metrics like weight, height, BMI, and blood pressure",
      image: feature1,
      details: "Our advanced health tracking system allows you to monitor all your vital health metrics in one place. Get detailed insights into your BMI trends, blood pressure variations, and other key health indicators. Set personal goals and track your progress with intuitive charts and analytics."
    },
    {
      title: "Create Personalized Exercise Plans",
      description: "AI will design the most suitable exercise program based on your physical condition and goals",
      image: feature2,
      details: "Using cutting-edge AI technology, we create exercise plans that are perfectly tailored to your fitness level, goals, and preferences. Our system adapts to your progress, adjusting workouts to ensure optimal results while preventing overexertion."
    },
    {
      title: "Smart Health Analysis",
      description: "Use AI technology to analyze your health trends and provide early warnings of potential health risks",
      image: feature3,
      details: "Our AI-powered health analysis system continuously monitors your health data to identify potential risks before they become serious issues. Get personalized recommendations and insights based on your unique health profile and lifestyle patterns."
    }
  ];

  return (
    <div 
      ref={containerRef}
      className="scroll-container h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth" 
      style={{
        scrollBehavior: 'smooth',
        scrollSnapType: 'y mandatory',
        transitionDuration: '500ms',
        transitionTimingFunction: 'cubic-bezier(0.45, 0, 0.55, 1)',
      } as React.CSSProperties}
    >
      {/* Navigation Dots */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-50 flex flex-col gap-4">
        {[0, 1, 2].map((index) => (
          <button
            key={index}
            onClick={() => scrollToPage(index)}
            className={`w-3 h-3 rounded-full border-2 border-[#64ffda] transition-all duration-200 hover:scale-110 ${
              activePage === index 
                ? 'bg-[#64ffda] scale-125' 
                : 'bg-transparent hover:bg-[#64ffda]/50'
            }`}
            aria-label={`Scroll to section ${index + 1}`}
            style={{ cursor: isScrollLocked ? 'wait' : 'pointer' }}
          />
        ))}
      </div>

      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>
      
      {/* Hero Section */}
      <div className="relative min-h-screen snap-start">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: '0.6'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a192f]/50 to-[#0a192f]/90" />
        
        <div className="relative z-10 max-w-7xl mx-auto h-screen flex items-center justify-center">
          <div className="px-4 sm:px-6 lg:px-8 w-full">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight">
                <span className="block text-white drop-shadow-lg">Intelligent Health</span>
                <span className="block text-[#64ffda] mt-2 drop-shadow-lg">Management System</span>
              </h1>
              <p className="mt-8 text-xl sm:text-2xl text-white drop-shadow-lg mx-auto">
                Track your health data, get personalized diet and exercise recommendations, and achieve your health goals
              </p>
              <div className="mt-12 flex flex-col sm:flex-row justify-center gap-6">
                <Link to="/register" 
                  className="px-12 py-4 text-lg font-medium rounded-md text-[#0a192f] bg-[#64ffda] hover:bg-[#64ffda]/90 transition-all shadow-lg transform hover:scale-105 duration-300">
                  GET STARTED
                </Link>
                <Link to="/about" 
                  className="px-12 py-4 text-lg font-medium rounded-md text-[#64ffda] border-2 border-[#64ffda] hover:bg-[#64ffda]/10 transition-all shadow-lg transform hover:scale-105 duration-300">
                  LEARN MORE
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
          <div className="animate-bounce w-6 h-6 border-2 border-[#64ffda] border-t-0 border-l-0 transform rotate-45 translate-y-0 shadow-lg"></div>
        </div>
      </div>

      {/* Features Section */}
      <div className="min-h-screen snap-start py-24 bg-[#112240]/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-[#64ffda] text-lg font-semibold tracking-wide uppercase drop-shadow-md">Features</h2>
            <p className="mt-2 text-4xl sm:text-5xl font-bold text-white drop-shadow-lg">
              Everything you need to track your health
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="relative group h-[400px] overflow-hidden rounded-lg">
                {/* Background Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ 
                    backgroundImage: `url(${feature.image})`,
                  }}
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a192f] via-[#0a192f]/70 to-transparent" />

                {/* Content */}
                <div className="relative h-full flex flex-col justify-end p-6 z-10">
                  <h3 className="text-2xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-300 mb-4">{feature.description}</p>
                  <button
                    onClick={() => setActiveFeature(activeFeature === index ? null : index)}
                    className="w-full px-4 py-2 bg-[#64ffda]/20 hover:bg-[#64ffda]/30 border border-[#64ffda] text-[#64ffda] rounded-md transition-all duration-300"
                  >
                    {activeFeature === index ? 'Close Details' : 'Learn More'}
                  </button>
                </div>

                {/* Details Panel */}
                {activeFeature === index && (
                  <div className="absolute inset-0 bg-[#0a192f]/95 p-6 transform transition-all duration-300 z-20">
                    <div className="h-full flex flex-col">
                      <h3 className="text-2xl font-bold text-[#64ffda] mb-4">{feature.title}</h3>
                      <p className="text-gray-200 flex-grow">{feature.details}</p>
                      <button
                        onClick={() => setActiveFeature(null)}
                        className="w-full mt-4 px-4 py-2 bg-[#64ffda]/20 hover:bg-[#64ffda]/30 border border-[#64ffda] text-[#64ffda] rounded-md transition-all duration-300"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative min-h-screen snap-start bg-[#0a192f]/80">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${ctaImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: '0.5'
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a192f]/80 via-[#0a192f]/70 to-[#0a192f]/60" />

        <div className="relative z-10 h-screen flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              <span className="block text-white drop-shadow-lg">
                Ready to start your health journey?
              </span>
              <span className="block text-[#64ffda] mt-2 drop-shadow-lg text-2xl sm:text-3xl lg:text-4xl">
                Register now to get started.
              </span>
            </h2>
            <p className="mt-6 text-gray-300 text-lg max-w-2xl mx-auto">
              Join thousands of users who have already transformed their lives with our intelligent health management system.
            </p>
            <div className="mt-10 flex flex-col items-center">
              <Link 
                to="/register" 
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-md text-[#0a192f] bg-[#64ffda] hover:bg-[#64ffda]/90 transition-all shadow-lg overflow-hidden transform hover:scale-105 duration-300"
              >
                <span className="relative z-10">Register Now</span>
                <div className="absolute inset-0 -translate-y-full group-hover:translate-y-0 bg-[#64ffda]/90 transition-transform duration-300"></div>
              </Link>
              <p className="mt-4 text-sm text-gray-400">
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0a192f] border-t border-[#1d2d50] snap-start">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-300">
            &copy; 2025 Health Tracking System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home; 