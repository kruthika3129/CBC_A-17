
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import PulseOrb from './PulseOrb';
import AuroraBackground from './AuroraBackground';
import { useIsMobile } from '@/hooks/use-mobile';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import 'react-lazy-load-image-component/src/effects/blur.css';

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setIsVisible(true);
    
    // Add magnetic effect to buttons - but only on non-mobile devices
    if (isMobile) return;
    
    const buttons = document.querySelectorAll('.magnetic-button');
    
    const handleMouseMove = (e: MouseEvent, button: Element) => {
      const rect = (button as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const moveX = (x - centerX) / 10;
      const moveY = (y - centerY) / 10;
      
      (button as HTMLElement).style.transform = `translate(${moveX}px, ${moveY}px)`;
    };
    
    const handleMouseLeave = (button: Element) => {
      (button as HTMLElement).style.transform = 'translate(0px, 0px)';
    };
    
    buttons.forEach(button => {
      button.addEventListener('mousemove', (e) => handleMouseMove(e as MouseEvent, button));
      button.addEventListener('mouseleave', () => handleMouseLeave(button));
    });
    
    return () => {
      buttons.forEach(button => {
        button.removeEventListener('mousemove', (e) => handleMouseMove(e as MouseEvent, button));
        button.removeEventListener('mouseleave', () => handleMouseLeave(button));
      });
    };
  }, [isMobile]);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.6,
        staggerChildren: 0.2
      } 
    }
  };
  
  const itemVariants = {
    hidden: { 
      y: 20, 
      opacity: 0 
    },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };
  
  return (
    <section ref={sectionRef} className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#1A1F2C] to-[#221F26]">
      {/* Aurora background with reduced opacity for better performance */}
      <AuroraBackground className="opacity-50" />
      
      {/* Reduced number of orbs for better performance */}
      <PulseOrb className="absolute bg-[#403E43]/30 w-[300px] h-[300px] md:w-[500px] md:h-[500px] -top-32 -left-32 md:-left-64" />
      <PulseOrb className="absolute bg-[#9F9EA1]/10 w-[250px] h-[250px] md:w-[400px] md:h-[400px] bottom-0 right-0" />
      
      <LazyMotion features={domAnimation}>
        <m.div 
          className="container relative z-10 px-4 py-12 md:py-24 mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <m.div variants={itemVariants}>
            <h1 ref={headlineRef} className="text-3xl md:text-5xl lg:text-7xl font-bold tracking-tighter mb-4 md:mb-6 text-white">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-[#8E9196]">PsyTrack</span>
              <span className="block text-2xl md:text-3xl lg:text-5xl mt-2 text-[#9F9EA1]">Emotional Intelligence Interface</span>
            </h1>
            
            <p ref={descriptionRef} className="mx-auto max-w-lg md:max-w-2xl text-base md:text-lg lg:text-xl mb-6 md:mb-8 text-[#8E9196]">
              A supportive space for autism and mental health awareness. 
              Track emotions, journal thoughts, and connect with therapists in a calm, 
              expressive environment.
            </p>
          </m.div>
          
          <m.div 
            ref={buttonsRef} 
            className="flex flex-wrap justify-center gap-3 md:gap-4 mb-10"
            variants={itemVariants}
          >
            <Button 
              size={isMobile ? "default" : "lg"} 
              className="magnetic-button bg-[#403E43] hover:bg-[#8A898C] text-white px-4 md:px-8"
            >
              Get Started
            </Button>
            <Button 
              variant="outline" 
              size={isMobile ? "default" : "lg"} 
              className="magnetic-button border-[#8E9196] text-[#8E9196] hover:bg-[#403E43]/10 px-4 md:px-8"
            >
              Demo Therapy Mode
            </Button>
          </m.div>
          
          <m.div 
            ref={featuresRef} 
            className="mt-8 md:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
            variants={itemVariants}
          >
            <div className="glass p-4 md:p-6 rounded-xl flex flex-col items-center text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#8E9196]/30 flex items-center justify-center mb-3 md:mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 11C20 15.418 16.418 19 12 19C7.582 19 4 15.418 4 11C4 6.582 7.582 3 12 3C16.418 3 20 6.582 20 11Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 7V11L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-medium mb-1 md:mb-2 text-white">Real-Time Tracking</h3>
              <p className="text-sm md:text-base text-[#8E9196]">Monitor emotions and patterns with intuitive visualization tools.</p>
            </div>
            
            <div className="glass p-4 md:p-6 rounded-xl flex flex-col items-center text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#9F9EA1]/30 flex items-center justify-center mb-3 md:mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 12H7L10 19L14 5L17 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-medium mb-1 md:mb-2 text-white">Journal Expression</h3>
              <p className="text-sm md:text-base text-[#8E9196]">Capture thoughts and feelings in a secure, guided journaling space.</p>
            </div>
            
            <div className="glass p-4 md:p-6 rounded-xl flex flex-col items-center text-center sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#403E43]/40 flex items-center justify-center mb-3 md:mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 8C17 10.7614 14.7614 13 12 13C9.23858 13 7 10.7614 7 8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M3 21C3 17.134 7.02944 14 12 14C16.9706 14 21 17.134 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-medium mb-1 md:mb-2 text-white">Therapist Connection</h3>
              <p className="text-sm md:text-base text-[#8E9196]">Connect with mental health professionals for personalized support.</p>
            </div>
          </m.div>
        </m.div>
      </LazyMotion>
      
      {/* Bottom wave decoration - simplified for better performance */}
      <div className="absolute bottom-0 left-0 w-full z-0 overflow-hidden leading-[0]">
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[40px] md:h-[60px] opacity-20">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C57.32,118.92,128.89,119.1,198.61,111.15Z" fill="#8E9196"></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
