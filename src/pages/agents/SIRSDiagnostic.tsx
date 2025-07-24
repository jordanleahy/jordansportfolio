import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SIRSResult {
  sirs: boolean;
  criteria_met: number;
  total_criteria: number;
  criteria_details: Array<{
    parameter: string;
    threshold: string;
    met: boolean;
    abnormal_values: Array<{
      timestamp: string;
      value: number;
      unit: string;
      reason: string;
    }>;
  }>;
  explanation: string;
  evaluation_window: string;
  timestamp: string;
}

const SIRSDiagnostic = () => {
  const [inputData, setInputData] = useState('');
  const [result, setResult] = useState<SIRSResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sampleData = `{
  "patient_id": "PT-12345",
  "admission_time": "2024-01-15T08:00:00Z",
  "vital_signs": [
    {
      "timestamp": "2024-01-15T08:30:00Z",
      "parameter": "temperature",
      "value": 38.5,
      "unit": "°C"
    },
    {
      "timestamp": "2024-01-15T08:30:00Z", 
      "parameter": "heart_rate",
      "value": 95,
      "unit": "bpm"
    },
    {
      "timestamp": "2024-01-15T08:30:00Z",
      "parameter": "respiratory_rate", 
      "value": 22,
      "unit": "breaths/min"
    }
  ],
  "lab_results": [
    {
      "timestamp": "2024-01-15T09:00:00Z",
      "parameter": "wbc_count",
      "value": 13500,
      "unit": "cells/mm³"
    }
  ]
}`;

  const handleEvaluate = async () => {
    if (!inputData.trim()) {
      toast({
        title: "Input Required",
        description: "Please provide patient data for SIRS evaluation",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const patientData = JSON.parse(inputData);
      
      const { data, error } = await supabase.functions.invoke('sirs-diagnostic-agent', {
        body: patientData
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "SIRS Evaluation Complete",
        description: `Result: ${data.sirs ? 'POSITIVE' : 'NEGATIVE'} (${data.criteria_met}/${data.total_criteria} criteria met)`,
        variant: data.sirs ? "destructive" : "default",
      });
    } catch (error) {
      console.error('SIRS evaluation error:', error);
      toast({
        title: "Evaluation Failed",
        description: error.message || "Failed to evaluate SIRS criteria",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleData = () => {
    setInputData(sampleData);
  };

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Activity className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">SIRS Diagnostic Agent</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Rules-based clinical agent that determines if a patient meets the criteria for 
              Systemic Inflammatory Response Syndrome (SIRS) using structured vital signs and lab data.
            </p>
          </div>

          {/* SIRS Criteria Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                SIRS Diagnostic Criteria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  SIRS is present if <strong>at least 2 of the following criteria</strong> are met within the first 48 hours of admission:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                    <Badge variant="outline">Temperature</Badge>
                    <span className="text-sm">&lt; 36°C or &gt; 38°C</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                    <Badge variant="outline">Heart Rate</Badge>
                    <span className="text-sm">&gt; 90 bpm</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                    <Badge variant="outline">Respiratory Rate</Badge>
                    <span className="text-sm">&gt; 20 breaths/min</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                    <Badge variant="outline">WBC Count</Badge>
                    <span className="text-sm">&lt; 4,000 or &gt; 12,000 cells/mm³</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Data Input</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadSampleData}>
                  Load Sample Data
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter patient vital signs and lab data in JSON format..."
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
              <Button 
                onClick={handleEvaluate} 
                disabled={isLoading || !inputData.trim()}
                className="w-full"
              >
                {isLoading ? 'Evaluating...' : 'Evaluate SIRS Criteria'}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.sirs ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  SIRS Evaluation Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge 
                    variant={result.sirs ? "destructive" : "secondary"}
                    className="text-lg px-4 py-2"
                  >
                    {result.sirs ? 'SIRS POSITIVE' : 'SIRS NEGATIVE'}
                  </Badge>
                  <span className="text-muted-foreground">
                    {result.criteria_met}/{result.total_criteria} criteria met
                  </span>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Clock className="h-4 w-4" />
                    {result.evaluation_window}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Criteria Details:</h4>
                  {result.criteria_details.map((criteria, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border-l-4 ${
                        criteria.met 
                          ? 'border-l-destructive bg-destructive/5' 
                          : 'border-l-muted bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{criteria.parameter}</span>
                          <span className="text-muted-foreground ml-2">({criteria.threshold})</span>
                        </div>
                        <Badge variant={criteria.met ? "destructive" : "secondary"}>
                          {criteria.met ? 'MET' : 'NOT MET'}
                        </Badge>
                      </div>
                      {criteria.abnormal_values.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {criteria.abnormal_values.map((value, vIndex) => (
                            <div key={vIndex} className="text-sm text-muted-foreground">
                              <span className="font-mono">{value.timestamp}: {value.value} {value.unit}</span>
                              <span className="ml-2">- {value.reason}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-secondary rounded-lg">
                  <h4 className="font-semibold mb-2">Clinical Explanation:</h4>
                  <p className="text-muted-foreground">{result.explanation}</p>
                </div>

                <div className="text-xs text-muted-foreground">
                  Evaluation completed at: {new Date(result.timestamp).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Agent Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Model:</span>
                  <p className="text-muted-foreground">GPT-4o</p>
                </div>
                <div>
                  <span className="font-medium">Temperature:</span>
                  <p className="text-muted-foreground">0.0 (deterministic)</p>
                </div>
                <div>
                  <span className="font-medium">Response Format:</span>
                  <p className="text-muted-foreground">JSON</p>
                </div>
                <div>
                  <span className="font-medium">Evaluation Window:</span>
                  <p className="text-muted-foreground">First 48 hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default SIRSDiagnostic;