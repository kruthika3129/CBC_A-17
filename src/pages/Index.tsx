
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import EmotionTimeline from '@/components/EmotionTimeline';
import JournalInput from '@/components/JournalInput';
import TherapistPanel from '@/components/TherapistPanel';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  return (
    <>
      <Navbar />
      <HeroSection />
      
      <section className="py-16 px-4 bg-[#222222]">
        <div className="container mx-auto">
          <h2 className={`text-3xl md:text-4xl font-bold text-center mb-12 transition-all duration-700 transform ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            Understand Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8E9196] to-[#9F9EA1]">Emotional Journey</span>
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`space-y-6 transition-all duration-700 transform ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`} style={{ transitionDelay: '100ms' }}>
              <EmotionTimeline />
              <TherapistPanel />
            </div>
            
            <JournalInput className={`h-full transition-all duration-700 transform animate-delay-300 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`} />
          </div>
        </div>
      </section>
      
      <section className="bg-gradient-to-br from-[#1A1F2C]/90 to-[#221F26] py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to Begin?</h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-[#8E9196]">
            Take the first step towards better emotional awareness and mental wellbeing.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button className="magnetic-button bg-[#403E43] hover:bg-[#8A898C] text-white px-8">
              Create Free Account
            </Button>
            <Button variant="outline" className="magnetic-button border-[#8E9196] text-[#8E9196] hover:bg-[#403E43]/10 px-8">
              Learn More
            </Button>
          </div>
        </div>
      </section>
      
      <footer className="py-8 px-4 border-t border-[#403E43]/20 bg-[#1A1F2C]">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-8 w-8 rounded-full bg-[#403E43] flex items-center justify-center mr-2">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="text-xl font-bold text-white">PsyTrack</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-4 md:mb-0">
              <a href="#" className="text-sm hover:text-[#9F9EA1] transition-colors text-[#8E9196]">Privacy</a>
              <a href="#" className="text-sm hover:text-[#9F9EA1] transition-colors text-[#8E9196]">Terms</a>
              <a href="#" className="text-sm hover:text-[#9F9EA1] transition-colors text-[#8E9196]">Accessibility</a>
              <a href="#" className="text-sm hover:text-[#9F9EA1] transition-colors text-[#8E9196]">Contact</a>
            </div>
            <div>
              <p className="text-sm text-[#8A898C]">© 2025 PsyTrack. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Index;
