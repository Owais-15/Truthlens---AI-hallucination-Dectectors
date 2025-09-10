import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Search, Trash, Copy } from 'lucide-react';
import { AnalysisResults } from './analysis-results';

interface AnalysisResult {
  analysisId: string;
  factualityScore: number;
  issues: Array<{
    text: string;
    severity: 'low' | 'medium' | 'high';
    explanation: string;
    correction: string;
    startIndex: number;
    endIndex: number;
    sources: Array<{
      title: string;
      url: string;
      snippet: string;
    }>;
    verificationResult: {
      isVerified: boolean;
      confidence: number;
    };
  }>;
  summary: string;
  overallAssessment: string;
  recommendations: string[];
}

export function Analyzer() {
  const [content, setContent] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analysisMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', '/api/analysis', { content });
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      queryClient.invalidateQueries({ queryKey: ['/api/user/usage'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analysis/history'] });
      toast({
        title: 'Analysis Complete',
        description: 'Your content has been analyzed for factual accuracy.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze content. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleAnalyze = () => {
    if (!content.trim()) {
      toast({
        title: 'Content Required',
        description: 'Please enter some content to analyze.',
        variant: 'destructive',
      });
      return;
    }
    analysisMutation.mutate(content);
  };

  const handleClear = () => {
    setContent('');
    setAnalysisResult(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setContent(text);
    } catch (error) {
      toast({
        title: 'Paste Failed',
        description: 'Unable to access clipboard. Please paste manually.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>AI Content Analyzer</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handlePaste} data-testid="button-paste">
                <Copy className="w-4 h-4 mr-1" />
                Paste
              </Button>
              <Button variant="outline" size="sm" onClick={handleClear} data-testid="button-clear">
                <Trash className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Textarea
            placeholder="Paste your AI-generated content here for fact-checking analysis..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[160px] resize-none"
            data-testid="input-content"
          />
          
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              <span data-testid="text-character-count">{content.length}</span> characters
            </div>
            <Button 
              onClick={handleAnalyze}
              disabled={analysisMutation.isPending || !content.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              data-testid="button-analyze"
            >
              {analysisMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Analyze Content
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysisResult && (
        <AnalysisResults 
          result={analysisResult} 
          originalContent={content}
        />
      )}
    </div>
  );
}
