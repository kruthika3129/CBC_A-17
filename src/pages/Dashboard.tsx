
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EmotionTimeline from '@/components/EmotionTimeline';
import TherapistPanel from '@/components/TherapistPanel';

const Dashboard = () => {
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <h1 className="text-3xl font-bold mb-6">Your Dashboard</h1>
        <p className="text-muted-foreground mb-8">Track your progress and manage your mental health journey.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EmotionTimeline />
          <TherapistPanel />
          
          <Card className="glass">
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Full dashboard features will be available in the next update.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
