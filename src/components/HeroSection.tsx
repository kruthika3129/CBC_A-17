
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { BackgroundPaths } from '@/components/ui/background-paths';
import { useIsMobile } from '@/hooks/use-mobile';
import { LazyMotion, domAnimation, m, motion } from 'framer-motion';
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
    <div className="relative bg-white dark:bg-black">
      {/* Background paths animation */}
      <div className="absolute inset-0 w-full h-full">
        <BackgroundPaths title="" />
      </div>

      <div ref={sectionRef} className="relative h-screen flex items-center justify-center">
        <LazyMotion features={domAnimation}>
          <m.div
            className="container relative z-10 px-4 mx-auto text-center flex flex-col items-center justify-center"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
          <m.div variants={itemVariants} className="max-w-3xl mx-auto">
            <h1 ref={headlineRef} className="text-3xl md:text-5xl lg:text-7xl font-bold tracking-tighter mb-4 md:mb-6 text-black dark:text-white">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-black to-gray-600 dark:from-white dark:to-gray-400">PsyTrack</span>
              <span className="block text-2xl md:text-3xl lg:text-5xl mt-2 text-gray-700 dark:text-gray-300">Emotional Intelligence Interface</span>
            </h1>

            <p ref={descriptionRef} className="mx-auto max-w-lg md:max-w-2xl text-base md:text-lg lg:text-xl mb-6 md:mb-8 text-gray-600 dark:text-gray-400">
              A supportive space for autism and mental health awareness.
              Track emotions, journal thoughts, and connect with therapists in a calm,
              expressive environment.
            </p>
          </m.div>

          <m.div
            ref={buttonsRef}
            className="flex flex-wrap justify-center gap-3 md:gap-6 mb-10 mt-8"
            variants={itemVariants}
          >
            <div className="group relative bg-gradient-to-b from-black/10 to-white/10 dark:from-white/10 dark:to-black/10 p-px rounded-2xl backdrop-blur-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Button
                size={isMobile ? "default" : "lg"}
                variant="ghost"
                className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold backdrop-blur-md bg-white/95 hover:bg-white/100 dark:bg-black/95 dark:hover:bg-black/100 text-black dark:text-white transition-all duration-300 group-hover:-translate-y-0.5 border border-black/10 dark:border-white/10 hover:shadow-md dark:hover:shadow-neutral-800/50 font-mono"
              >
                <span className="opacity-90 group-hover:opacity-100 transition-opacity">Get Started</span>
                <span className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300">→</span>
              </Button>
            </div>

            <div className="group relative bg-gradient-to-b from-black/10 to-white/10 dark:from-white/10 dark:to-black/10 p-px rounded-2xl backdrop-blur-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Button
                variant="ghost"
                size={isMobile ? "default" : "lg"}
                className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold backdrop-blur-md bg-white/5 hover:bg-white/10 dark:bg-black/5 dark:hover:bg-black/10 text-black dark:text-white transition-all duration-300 group-hover:-translate-y-0.5 border border-black/10 dark:border-white/10 hover:shadow-md dark:hover:shadow-neutral-800/50 font-mono"
              >
                <span className="opacity-90 group-hover:opacity-100 transition-opacity">Demo Therapy Mode</span>
                <span className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300">→</span>
              </Button>
            </div>
          </m.div>

        </m.div>
      </LazyMotion>
      </div>

      {/* Feature cards section - positioned below hero content */}
      <div className="relative min-h-screen py-32 md:py-40" id="features">
        <div className="container mx-auto px-4">
          <motion.div
            ref={featuresRef}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto"
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 rounded-xl opacity-75 bg-gradient-to-r from-[#9b87f5] to-[#D6BCFA] blur-sm group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="glass p-4 md:p-6 rounded-xl flex flex-col items-center text-center bg-white/70 dark:bg-black/70 border border-transparent relative">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mb-3 md:mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 11C20 15.418 16.418 19 12 19C7.582 19 4 15.418 4 11C4 6.582 7.582 3 12 3C16.418 3 20 6.582 20 11Z" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 7V11L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-medium mb-1 md:mb-2 text-black dark:text-white">Real-Time Tracking</h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Monitor emotions and patterns with intuitive visualization tools.</p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 rounded-xl opacity-75 bg-gradient-to-r from-[#D3E4FD] to-[#F2FCE2] blur-sm group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="glass p-4 md:p-6 rounded-xl flex flex-col items-center text-center bg-white/70 dark:bg-black/70 border border-transparent relative">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mb-3 md:mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 12H7L10 19L14 5L17 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-medium mb-1 md:mb-2 text-black dark:text-white">Journal Expression</h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Capture thoughts and feelings in a secure, guided journaling space.</p>
              </div>
            </div>

            <div className="relative group sm:col-span-2 lg:col-span-1">
              <div className="absolute -inset-0.5 rounded-xl opacity-75 bg-gradient-to-r from-[#F1F0FB] to-[#6E59A5] blur-sm group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="glass p-4 md:p-6 rounded-xl flex flex-col items-center text-center bg-white/70 dark:bg-black/70 border border-transparent relative">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mb-3 md:mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 8C17 10.7614 14.7614 13 12 13C9.23858 13 7 10.7614 7 8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8Z" stroke="currentColor" strokeWidth="2" />
                    <path d="M3 21C3 17.134 7.02944 14 12 14C16.9706 14 21 17.134 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-medium mb-1 md:mb-2 text-black dark:text-white">Therapist Connection</h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Connect with mental health professionals for personalized support.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom wave decoration - positioned at the bottom of the first section */}
      <div className="absolute bottom-0 left-0 w-full z-0 overflow-hidden leading-[0] pointer-events-none">
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[40px] md:h-[60px] opacity-20">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C57.32,118.92,128.89,119.1,198.61,111.15Z" fill="#8E9196"></path>
        </svg>
      </div>
    </div>
  );
};

export default HeroSection;
