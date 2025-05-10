
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import PulseOrb from './PulseOrb';
import AuroraBackground from './AuroraBackground';
import gsap from 'gsap';
import { LazyLoadComponent } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setIsVisible(true);
    
    if (!sectionRef.current) return;
    
    // GSAP animations
    const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
    
    timeline
      .fromTo(headlineRef.current, 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1.2 }
      )
      .fromTo(descriptionRef.current, 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1 }, 
        "-=0.8"
      )
      .fromTo(buttonsRef.current, 
        { y: 20, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8 }, 
        "-=0.6"
      )
      .fromTo(featuresRef.current, 
        { y: 40, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1 }, 
        "-=0.4"
      );
      
    // Add magnetic effect to buttons
    const buttons = document.querySelectorAll('.magnetic-button');
    
    buttons.forEach(button => {
      button.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = (button as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const moveX = (x - centerX) / 10;
        const moveY = (y - centerY) / 10;
        
        gsap.to(button, {
          x: moveX,
          y: moveY,
          duration: 0.3,
          ease: "power2.out"
        });
      });
      
      button.addEventListener('mouseleave', () => {
        gsap.to(button, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: "elastic.out(1, 0.3)"
        });
      });
    });
    
    return () => {
      buttons.forEach(button => {
        button.replaceWith(button.cloneNode(true));
      });
    };
  }, []);
  
  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#1A1F2C] to-[#221F26]">
      {/* Aurora background */}
      <AuroraBackground />
      
      {/* Background orbs for visual effect */}
      <PulseOrb className="bg-[#403E43]/30 w-[500px] h-[500px] top-0 -left-64" />
      <PulseOrb className="bg-[#8A898C]/20 w-[600px] h-[600px] -top-32 -right-32" />
      <PulseOrb className="bg-[#9F9EA1]/10 w-[400px] h-[400px] bottom-0 right-0" />
      
      <div className="container relative z-10 px-4 py-32 mx-auto text-center">
        <div>
          <h1 ref={headlineRef} className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter mb-6 text-white">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-[#8E9196]">PsyTrack</span>
            <span className="block text-3xl md:text-4xl lg:text-5xl mt-2 text-[#9F9EA1]">Emotional Intelligence Interface</span>
          </h1>
          
          <p ref={descriptionRef} className="mx-auto max-w-2xl text-lg md:text-xl mb-8 text-[#8E9196]">
            A supportive space for autism and mental health awareness. 
            Track emotions, journal thoughts, and connect with therapists in a calm, 
            expressive environment.
          </p>
          
          <div ref={buttonsRef} className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              className="magnetic-button bg-[#403E43] hover:bg-[#8A898C] text-white px-8"
            >
              Get Started
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="magnetic-button border-[#8E9196] text-[#8E9196] hover:bg-[#403E43]/10 px-8"
            >
              Demo Therapy Mode
            </Button>
          </div>
        </div>
        
        <LazyLoadComponent effect="blur" threshold={100}>
          <div ref={featuresRef} className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass p-6 rounded-xl flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#8E9196]/30 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 11C20 15.418 16.418 19 12 19C7.582 19 4 15.418 4 11C4 6.582 7.582 3 12 3C16.418 3 20 6.582 20 11Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 7V11L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2 text-white">Real-Time Tracking</h3>
              <p className="text-[#8E9196]">Monitor emotions and patterns with intuitive visualization tools.</p>
            </div>
            
            <div className="glass p-6 rounded-xl flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#9F9EA1]/30 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 12H7L10 19L14 5L17 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2 text-white">Journal Expression</h3>
              <p className="text-[#8E9196]">Capture thoughts and feelings in a secure, guided journaling space.</p>
            </div>
            
            <div className="glass p-6 rounded-xl flex flex-col items-center text-center md:col-span-2 lg:col-span-1">
              <div className="w-16 h-16 rounded-full bg-[#403E43]/40 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 8C17 10.7614 14.7614 13 12 13C9.23858 13 7 10.7614 7 8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M3 21C3 17.134 7.02944 14 12 14C16.9706 14 21 17.134 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2 text-white">Therapist Connection</h3>
              <p className="text-[#8E9196]">Connect with mental health professionals for personalized support.</p>
            </div>
          </div>
        </LazyLoadComponent>
      </div>
      
      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 w-full z-0 overflow-hidden leading-[0]">
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[60px] opacity-20">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C57.32,118.92,128.89,119.1,198.61,111.15Z" fill="#8E9196"></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
