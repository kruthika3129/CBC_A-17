import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LimeExplanationProps {
  features: string[];
  weights: number[];
  localPrediction: number;
  intercept: number;
  className?: string;
}

const LimeExplanation: React.FC<LimeExplanationProps> = ({ 
  features, 
  weights, 
  localPrediction, 
  intercept,
  className 
}) => {
  // Combine features and weights
  const featureWeights = features.map((feature, index) => ({
    feature,
    weight: weights[index]
  }));
  
  // Sort by absolute weight (importance)
  const sortedFeatureWeights = [...featureWeights].sort((a, b) => 
    Math.abs(b.weight) - Math.abs(a.weight)
  );
  
  // Get max weight for scaling
  const maxWeight = Math.max(...sortedFeatureWeights.map(fw => Math.abs(fw.weight)));
  
  return (
    <Card className={`glass ${className || ''}`}>
      <CardHeader>
        <CardTitle>LIME Local Explanation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Prediction Confidence</span>
            <span className="text-sm text-gray-500">{(localPrediction * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${localPrediction * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="space-y-3 mt-6">
          <h3 className="text-sm font-medium mb-2">Feature Contributions</h3>
          {sortedFeatureWeights.map((fw, index) => {
            const isPositive = fw.weight >= 0;
            const barWidth = Math.min(Math.abs(fw.weight) / maxWeight * 100, 100);
            
            return (
              <div key={index} className="relative">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{fw.feature}</span>
                  <span className="text-sm text-gray-500">{fw.weight.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div 
                    className={`h-2.5 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${barWidth}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Base Value</h3>
          <div className="flex justify-between mb-1">
            <span className="text-sm">Intercept</span>
            <span className="text-sm text-gray-500">{intercept.toFixed(2)}</span>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-6">
          LIME explains predictions by approximating the model locally with a simpler, interpretable model.
          Green bars show features that increase the prediction, while red bars show features that decrease it.
        </p>
      </CardContent>
    </Card>
  );
};

export default LimeExplanation;
