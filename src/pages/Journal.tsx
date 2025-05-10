
import Navbar from '@/components/Navbar';
import JournalInput from '@/components/JournalInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Journal = () => {
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <h1 className="text-3xl font-bold mb-6">Your Journal</h1>
        <p className="text-muted-foreground mb-8">Express yourself freely in a safe, private space.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <JournalInput />
          
          <Card className="glass">
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Your journal entries will appear here.</p>
              <p className="text-muted-foreground mt-4">No entries yet. Start journaling to see your history.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

export default Journal;
