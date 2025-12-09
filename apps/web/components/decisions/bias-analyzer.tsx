'use client';

import { CognitiveBias } from '@cortex/shared/types';
import { AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface BiasAnalyzerProps {
  biases: CognitiveBias[];
}

export function BiasAnalyzer({ biases }: BiasAnalyzerProps) {
  if (biases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" />
            Bias Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            No significant cognitive biases detected in this decision.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getBiasDescription = (type: CognitiveBias['type']): string => {
    const descriptions: Record<CognitiveBias['type'], string> = {
      confirmation_bias: 'Tendency to search for or interpret information in a way that confirms preexisting beliefs.',
      anchoring: 'Over-reliance on the first piece of information encountered.',
      sunk_cost: 'Continuing a behavior due to previously invested resources.',
      availability_heuristic: 'Overestimating likelihood based on recent or memorable examples.',
      optimism_bias: 'Overestimating positive outcomes and underestimating risks.',
      loss_aversion: 'Preferring to avoid losses over acquiring equivalent gains.',
      groupthink: 'Desire for harmony leads to irrational decision-making.',
    };
    return descriptions[type];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Detected Cognitive Biases
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {biases.map((bias, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold capitalize">
                {bias.type.replace(/_/g, ' ')}
              </h4>
              <span className="text-xs text-gray-500">
                {Math.round(bias.confidence * 100)}% confidence
              </span>
            </div>
            
            <Progress value={bias.confidence * 100} className="h-2" />
            
            <p className="text-xs text-gray-600">
              {getBiasDescription(bias.type)}
            </p>
            
            <div className="ml-4 space-y-1">
              {bias.indicators.map((indicator, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                  <span className="text-amber-500">•</span>
                  <span>{indicator}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}