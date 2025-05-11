import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip } from '@/components/ui/tooltip';

interface ShapValue {
  feature: string;
  importance: number;
  impact: number;
}

interface ShapVisualizationProps {
  shapValues: ShapValue[];
  className?: string;
}

const ShapVisualization: React.FC<ShapVisualizationProps> = ({ shapValues, className }) => {
  // Sort values by importance
  const sortedValues = [...shapValues].sort((a, b) => b.importance - a.importance);
  
  // Get max importance for scaling
  const maxImportance = Math.max(...sortedValues.map(v => v.importance));
  
  // Format feature names for display
  const formatFeatureName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <Card className={`glass ${className || ''}`}>
      <CardHeader>
        <CardTitle>SHAP Feature Importance</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="importance">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="importance">Importance</TabsTrigger>
            <TabsTrigger value="impact">Impact</TabsTrigger>
          </TabsList>
          
          <TabsContent value="importance" className="mt-4">
            <div className="space-y-3">
              {sortedValues.map((value, index) => (
                <div key={index} className="relative">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{formatFeatureName(value.feature)}</span>
                    <span className="text-sm text-gray-500">{value.importance.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${(value.importance / maxImportance) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              SHAP values show how much each feature contributes to the prediction.
              Higher values indicate more important features.
            </p>
          </TabsContent>
          
          <TabsContent value="impact" className="mt-4">
            <div className="space-y-3">
              {sortedValues.map((value, index) => {
                const isPositive = value.impact >= 0;
                const barWidth = Math.min(Math.abs(value.impact) / maxImportance * 100, 100);
                
                return (
                  <div key={index} className="relative">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{formatFeatureName(value.feature)}</span>
                      <span className="text-sm text-gray-500">{value.impact.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 flex items-center">
                      <div className="absolute left-1/2 w-0.5 h-2.5 bg-gray-400"></div>
                      {isPositive ? (
                        <div className="ml-auto">
                          <div 
                            className="bg-green-500 h-2.5 rounded-full" 
                            style={{ width: `${barWidth}%` }}
                          ></div>
                        </div>
                      ) : (
                        <div className="mr-auto">
                          <div 
                            className="bg-red-500 h-2.5 rounded-full" 
                            style={{ width: `${barWidth}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Impact shows whether a feature pushes the prediction toward (positive) or away from (negative) the detected emotion.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ShapVisualization;
