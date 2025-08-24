import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useCharacterReferenceDemo } from '@/hooks/useCharacterReferenceDemo';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface QATestCase {
  id: string;
  name: string;
  input: string;
  expectedCharacter: string | null;
  description: string;
}

const QA_TEST_CASES: QATestCase[] = [
  {
    id: 'dandan-basic',
    name: 'DanDan Basic Detection',
    input: 'Create a How to stop on the snowboard by DanDan',
    expectedCharacter: 'DanDan',
    description: 'Tests basic character detection with "by DanDan" pattern'
  },
  {
    id: 'dandan-variation',
    name: 'DanDan Variation',
    input: 'Make a cooking tutorial featuring DanDan',
    expectedCharacter: 'DanDan',
    description: 'Tests character detection with "featuring" pattern'
  },
  {
    id: 'no-character',
    name: 'No Character Reference',
    input: 'Create a general snowboard tutorial',
    expectedCharacter: null,
    description: 'Tests that no character is detected when none specified'
  },
  {
    id: 'unknown-character',
    name: 'Unknown Character',
    input: 'Create a tutorial by NonExistentCharacter',
    expectedCharacter: null,
    description: 'Tests handling of non-existent characters'
  }
];

export const QACharacterReferenceDemo = () => {
  const [customInput, setCustomInput] = useState('');
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const { testCharacterReference, isProcessing, result } = useCharacterReferenceDemo();

  const runTestCase = async (testCase: QATestCase) => {
    console.log(`🧪 Running QA Test: ${testCase.name}`);
    await testCharacterReference(testCase.input);
  };

  const runAllTests = async () => {
    console.log('🚀 Running all QA test cases...');
    for (const testCase of QA_TEST_CASES) {
      console.log(`\n📋 Test Case: ${testCase.name}`);
      console.log(`📝 Input: "${testCase.input}"`);
      console.log(`🎯 Expected Character: ${testCase.expectedCharacter || 'None'}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay between tests
      await runTestCase(testCase);
    }
  };

  const getStatusIcon = (success: boolean | null) => {
    if (success === null) return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    return success ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Character Reference Detection QA Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Custom Test Input */}
          <div className="space-y-4">
            <Label htmlFor="custom-input">Custom Test Input</Label>
            <div className="flex gap-2">
              <Input
                id="custom-input"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Enter test input like 'Create a tutorial by DanDan'"
                className="flex-1"
              />
              <Button 
                onClick={() => testCharacterReference(customInput)}
                disabled={isProcessing || !customInput.trim()}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
              </Button>
            </div>
          </div>

          {/* Predefined Test Cases */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Predefined QA Test Cases</Label>
              <Button onClick={runAllTests} disabled={isProcessing} variant="outline">
                Run All Tests
              </Button>
            </div>
            
            <div className="grid gap-3">
              {QA_TEST_CASES.map((testCase) => (
                <Card key={testCase.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{testCase.name}</span>
                        {testResults[testCase.id] && getStatusIcon(testResults[testCase.id].success)}
                      </div>
                      <p className="text-sm text-muted-foreground">{testCase.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Input: "{testCase.input}"</Badge>
                        <Badge variant={testCase.expectedCharacter ? "default" : "secondary"}>
                          Expected: {testCase.expectedCharacter || "No Character"}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      onClick={() => runTestCase(testCase)}
                      disabled={isProcessing}
                      size="sm"
                    >
                      Test
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Results Display */}
          {result && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Latest Test Result
                  {getStatusIcon(result.success)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Success:</strong> {result.success ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <strong>Character Detected:</strong> {result.characterDetected ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <strong>Character Name:</strong> {result.characterName || 'None'}
                    </div>
                    <div>
                      <strong>Theme ID:</strong> {result.themeId || 'N/A'}
                    </div>
                    <div>
                      <strong>Has Reference:</strong> {result.hasCharacterReference ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <strong>Theme Name:</strong> {result.themeName || 'N/A'}
                    </div>
                  </div>
                  
                  {result.characterAnalysis && (
                    <div className="mt-4">
                      <strong>Character Analysis:</strong>
                      <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.characterAnalysis, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {result.warnings?.length > 0 && (
                    <div className="mt-4">
                      <strong>Warnings:</strong>
                      <ul className="mt-2 space-y-1">
                        {result.warnings.map((warning: string, index: number) => (
                          <li key={index} className="text-sm text-amber-600">• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                      <strong className="text-red-800">Error:</strong>
                      <p className="text-red-700 text-sm mt-1">{result.error}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};