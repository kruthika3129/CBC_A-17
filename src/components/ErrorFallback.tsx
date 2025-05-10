import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center text-destructive">
          <AlertCircle className="mr-2 h-5 w-5" />
          Component Error
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-destructive">
          There was an error loading this component:
        </p>
        <div className="bg-muted p-3 rounded-md text-sm overflow-auto max-h-32">
          {error.message}
        </div>
        <Button 
          onClick={resetErrorBoundary} 
          variant="outline" 
          className="w-full"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
};

export default ErrorFallback;
