
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';

const About = () => {
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <h1 className="text-3xl font-bold mb-6">About PsyTrack</h1>
        <p className="text-muted-foreground mb-8 max-w-3xl">
          PsyTrack is an emotionally intelligent interface focused on autism and mental health awareness.
          Our platform provides tools for emotional expression, tracking, and therapeutic support.
        </p>
        
        <Card className="glass mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-medium mb-4">Our Mission</h2>
            <p>
              At PsyTrack, we believe in creating a world where mental health support is accessible, 
              intuitive, and tailored to individual needs. We're particularly focused on providing tools 
              that work well for neurodiverse audiences, with emphasis on autism support.
            </p>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass h-full">
            <CardContent className="p-6">
              <h2 className="text-xl font-medium mb-4">Features</h2>
              <ul className="space-y-2">
                <li>• Emotion tracking with visual timelines</li>
                <li>• Private journaling with sentiment analysis</li>
                <li>• Therapist connection and data sharing</li>
                <li>• Accessibility-focused design</li>
                <li>• Calm, non-intrusive user experience</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="glass h-full">
            <CardContent className="p-6">
              <h2 className="text-xl font-medium mb-4">Contact Us</h2>
              <p className="mb-4">We'd love to hear from you! Reach out for support, partnerships, or feedback.</p>
              <p className="text-muted-foreground">Email: support@psytrack.example</p>
              <p className="text-muted-foreground">Phone: (123) 456-7890</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

export default About;
