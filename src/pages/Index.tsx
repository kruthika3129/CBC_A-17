
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import EmotionTimeline from '@/components/EmotionTimeline';
import JournalInput from '@/components/JournalInput';
import TherapistPanel from '@/components/TherapistPanel';

const Index = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  return (
    <>
      <Navbar />
      <HeroSection />
      
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className={`text-3xl md:text-4xl font-bold text-center mb-12 transition-all duration-700 transform ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            Understand Your <span className="magic-text">Emotional Journey</span>
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`space-y-6 transition-all duration-700 transform ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`} style={{ transitionDelay: '100ms' }}>
              <EmotionTimeline />
              <TherapistPanel />
            </div>
            
            <JournalInput className={`h-full transition-all duration-700 transform ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`} style={{ transitionDelay: '300ms' }} />
          </div>
        </div>
      </section>
      
      <section className="bg-gradient-to-br from-psytrack-purple/5 to-psytrack-light-purple/10 py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Begin?</h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-muted-foreground">
            Take the first step towards better emotional awareness and mental wellbeing.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button className="magnetic-button bg-psytrack-purple hover:bg-psytrack-deep-purple text-white px-8">
              Create Free Account
            </Button>
            <Button variant="outline" className="magnetic-button border-psytrack-purple text-psytrack-purple hover:bg-psytrack-purple/10 px-8">
              Learn More
            </Button>
          </div>
        </div>
      </section>
      
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-8 w-8 rounded-full bg-psytrack-purple flex items-center justify-center mr-2">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="text-xl font-bold">PsyTrack</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-4 md:mb-0">
              <a href="#" className="text-sm hover:text-psytrack-purple transition-colors">Privacy</a>
              <a href="#" className="text-sm hover:text-psytrack-purple transition-colors">Terms</a>
              <a href="#" className="text-sm hover:text-psytrack-purple transition-colors">Accessibility</a>
              <a href="#" className="text-sm hover:text-psytrack-purple transition-colors">Contact</a>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">© 2025 PsyTrack. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Index;
