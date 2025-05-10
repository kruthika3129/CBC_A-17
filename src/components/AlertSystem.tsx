import { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AIService from '@/services/aiService';
import { EmotionAlert } from '@/lib/aiCore';

interface AlertSystemProps {
  className?: string;
}

const AlertSystem: React.FC<AlertSystemProps> = ({ className }) => {
  const aiService = AIService.getInstance();
  const [alerts, setAlerts] = useState<EmotionAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  
  // Subscribe to alerts from the AI service
  useEffect(() => {
    const handleAlerts = (newAlerts: EmotionAlert[]) => {
      // Filter out already dismissed alerts
      const filteredAlerts = newAlerts.filter(alert => {
        const alertId = `${alert.type}-${alert.emotion}-${alert.triggeredAt}`;
        return !dismissedAlerts.has(alertId);
      });
      
      if (filteredAlerts.length > 0) {
        setAlerts(prev => [...prev, ...filteredAlerts]);
      }
    };
    
    aiService.onAlert(handleAlerts);
    
    return () => {
      aiService.removeAlertListener(handleAlerts);
    };
  }, [dismissedAlerts]);
  
  // Dismiss an alert
  const dismissAlert = (alert: EmotionAlert) => {
    const alertId = `${alert.type}-${alert.emotion}-${alert.triggeredAt}`;
    setDismissedAlerts(prev => new Set(prev).add(alertId));
    setAlerts(prev => prev.filter(a => a !== alert));
  };
  
  // Get icon based on alert severity
  const getAlertIcon = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };
  
  // Get alert variant based on severity
  const getAlertVariant = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'default';
    }
  };
  
  // Get alert title based on type
  const getAlertTitle = (alert: EmotionAlert) => {
    switch (alert.type) {
      case 'sustained_negative':
        return `Sustained ${alert.emotion} detected`;
      case 'sudden_change':
        return `Emotional shift to ${alert.emotion}`;
      case 'recurring_pattern':
        return `Recurring ${alert.emotion} pattern`;
      case 'intensity_spike':
        return `${alert.emotion} intensity spike`;
      case 'prolonged_fatigue':
        return 'Prolonged fatigue detected';
      case 'emotional_volatility':
        return 'Emotional volatility detected';
      case 'positive_trend':
        return `Positive trend: ${alert.emotion}`;
      default:
        return `${alert.emotion} alert`;
    }
  };
  
  if (alerts.length === 0) {
    return null;
  }
  
  return (
    <div className={`space-y-3 ${className || ''}`}>
      {alerts.map((alert, index) => (
        <Alert 
          key={`${alert.type}-${alert.emotion}-${alert.triggeredAt}-${index}`}
          variant={getAlertVariant(alert.severity) as any}
          className="relative"
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => dismissAlert(alert)}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-start gap-2">
            {getAlertIcon(alert.severity)}
            <div>
              <AlertTitle>{getAlertTitle(alert)}</AlertTitle>
              <AlertDescription>{alert.suggestion}</AlertDescription>
              
              {alert.context && (
                <p className="text-xs mt-1 text-muted-foreground">
                  Context: {alert.context}
                </p>
              )}
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
};

export default AlertSystem;
