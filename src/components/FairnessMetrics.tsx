import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface FairnessMetricsProps {
  demographicParity: Record<string, number>;
  equalizedOdds: Record<string, number>;
  disparateImpact: Record<string, number>;
  groupFairnessScore: number;
  className?: string;
}

const FairnessMetrics: React.FC<FairnessMetricsProps> = ({
  demographicParity,
  equalizedOdds,
  disparateImpact,
  groupFairnessScore,
  className
}) => {
  // Format demographic group names
  const formatGroupName = (name: string) => {
    const [category, value] = name.split('_');
    return `${category.charAt(0).toUpperCase() + category.slice(1)}: ${value.charAt(0).toUpperCase() + value.slice(1)}`;
  };
  
  // Group demographic parity metrics by category
  const groupedDemographicParity: Record<string, Record<string, number>> = {};
  Object.entries(demographicParity).forEach(([key, value]) => {
    const [category, group] = key.split('_');
    if (!groupedDemographicParity[category]) {
      groupedDemographicParity[category] = {};
    }
    groupedDemographicParity[category][group] = value;
  });
  
  return (
    <Card className={`glass ${className || ''}`}>
      <CardHeader>
        <CardTitle>Fairness Metrics</CardTitle>
        <CardDescription>
          Evaluating model fairness across demographic groups
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="demographic-parity">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="demographic-parity">Demographic Parity</TabsTrigger>
            <TabsTrigger value="disparate-impact">Disparate Impact</TabsTrigger>
            <TabsTrigger value="overall">Overall Score</TabsTrigger>
          </TabsList>
          
          <TabsContent value="demographic-parity" className="mt-4">
            <div className="space-y-6">
              {Object.entries(groupedDemographicParity).map(([category, groups]) => (
                <div key={category} className="space-y-3">
                  <h3 className="text-sm font-medium capitalize">{category}</h3>
                  {Object.entries(groups).map(([group, value]) => (
                    <div key={group} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm capitalize">{group}</span>
                        <span className="text-sm text-gray-500">{(value * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={value * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Demographic parity measures whether different groups receive positive predictions at similar rates.
              Closer values indicate more fair predictions.
            </p>
          </TabsContent>
          
          <TabsContent value="disparate-impact" className="mt-4">
            <div className="space-y-4">
              {Object.entries(disparateImpact).map(([key, value]) => {
                const [category] = key.split('_');
                const fairnessScore = Math.min(Math.abs(1 - value) * 100, 100);
                const fairnessColor = fairnessScore < 20 ? 'text-green-500' : 
                                     fairnessScore < 40 ? 'text-yellow-500' : 'text-red-500';
                
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium capitalize">{category} Ratio</span>
                      <span className="text-sm text-gray-500">{value.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${Math.min(value * 50, 100)}%` }}
                        ></div>
                      </div>
                      <div className="min-w-[80px] text-right">
                        <span className={`text-sm font-medium ${fairnessColor}`}>
                          {fairnessScore < 20 ? 'Fair' : 
                           fairnessScore < 40 ? 'Moderate' : 'Unfair'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Disparate impact measures the ratio of positive prediction rates between different groups.
              A ratio of 1.0 indicates perfect fairness, while values far from 1.0 indicate potential bias.
            </p>
          </TabsContent>
          
          <TabsContent value="overall" className="mt-4">
            <div className="text-center mb-4">
              <div className="text-4xl font-bold mb-2">
                {(groupFairnessScore * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-500">Overall Fairness Score</div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700 mb-6">
              <div 
                className={`h-4 rounded-full ${
                  groupFairnessScore > 0.8 ? 'bg-green-500' : 
                  groupFairnessScore > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${groupFairnessScore * 100}%` }}
              ></div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-gray-100 dark:bg-gray-800">
                <div className="text-sm font-medium">Poor</div>
                <div className="text-xs text-gray-500">&lt; 60%</div>
              </div>
              <div className="p-2 rounded bg-gray-100 dark:bg-gray-800">
                <div className="text-sm font-medium">Moderate</div>
                <div className="text-xs text-gray-500">60-80%</div>
              </div>
              <div className="p-2 rounded bg-gray-100 dark:bg-gray-800">
                <div className="text-sm font-medium">Good</div>
                <div className="text-xs text-gray-500">&gt; 80%</div>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-6">
              The overall fairness score combines multiple metrics to provide a single measure of model fairness.
              Higher scores indicate more fair predictions across all demographic groups.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FairnessMetrics;
