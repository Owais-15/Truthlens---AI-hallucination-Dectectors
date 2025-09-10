import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, Share, ExternalLink } from 'lucide-react';
import { generatePDFReport } from '@/lib/pdf-generator';
import { useToast } from '@/hooks/use-toast';

interface AnalysisResultsProps {
  result: {
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
  };
  originalContent: string;
}

export function AnalysisResults({ result, originalContent }: AnalysisResultsProps) {
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  const handleExportPDF = async () => {
    try {
      await generatePDFReport(result, originalContent);
      toast({
        title: 'PDF Generated',
        description: 'Your analysis report has been downloaded.',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to generate PDF report.',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'TruthLens Analysis Results',
        text: `Factuality Score: ${result.factualityScore}/100`,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link Copied',
          description: 'Analysis link copied to clipboard.',
        });
      } catch (clipboardError) {
        toast({
          title: 'Share Failed',
          description: 'Unable to share analysis.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleHighlightClick = (issue: any) => {
    setSelectedIssue(issue);
    setShowModal(true);
  };

  const renderHighlightedContent = () => {
    let highlightedText = originalContent;
    const sortedIssues = [...result.issues].sort((a, b) => b.startIndex - a.startIndex);

    sortedIssues.forEach((issue, index) => {
      const beforeText = highlightedText.substring(0, issue.startIndex);
      const issueText = highlightedText.substring(issue.startIndex, issue.endIndex);
      const afterText = highlightedText.substring(issue.endIndex);

      const severityClass = {
        low: 'bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-400',
        medium: 'bg-orange-100 dark:bg-orange-900/30 border-l-4 border-orange-500',
        high: 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500'
      }[issue.severity];

      highlightedText = `${beforeText}<span class="${severityClass} p-1 rounded cursor-pointer hover:shadow-sm transition-shadow" data-issue-index="${index}">${issueText}</span>${afterText}`;
    });

    return { __html: highlightedText };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
      case 'medium': return 'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200';
      case 'low': return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
      default: return '';
    }
  };

  const getScoreColor = () => {
    if (result.factualityScore >= 80) return 'text-green-600';
    if (result.factualityScore >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <>
      <Card data-testid="analysis-results">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Analysis Results</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF} data-testid="button-export-pdf">
                <Download className="w-4 h-4 mr-1" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare} data-testid="button-share">
                <Share className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Factuality Score */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Factuality Score</span>
              <span className={`text-2xl font-bold ${getScoreColor()}`} data-testid="text-factuality-score">
                {result.factualityScore}/100
              </span>
            </div>
            <Progress value={result.factualityScore} className="h-3 mb-1" />
            <p className="text-xs text-muted-foreground" data-testid="text-overall-assessment">
              {result.overallAssessment}
            </p>
          </div>

          {/* Analyzed Content with Highlights */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Analyzed Content</h4>
            <div 
              className="p-4 bg-background border border-border rounded-lg text-sm leading-relaxed cursor-pointer"
              dangerouslySetInnerHTML={renderHighlightedContent()}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                const issueIndex = target.getAttribute('data-issue-index');
                if (issueIndex !== null) {
                  handleHighlightClick(result.issues[parseInt(issueIndex)]);
                }
              }}
              data-testid="content-highlighted"
            />
          </div>

          {/* Issues Summary */}
          {result.issues.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Issues Detected</h4>
              <div className="space-y-3">
                {result.issues.map((issue, index) => (
                  <div 
                    key={index}
                    className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:shadow-sm transition-shadow ${getSeverityColor(issue.severity)}`}
                    onClick={() => handleHighlightClick(issue)}
                    data-testid={`issue-${issue.severity}-${index}`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      issue.severity === 'high' ? 'bg-red-500' :
                      issue.severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium capitalize">
                          {issue.severity} Severity
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {issue.verificationResult.confidence}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm">{issue.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Recommendations</h4>
              <ul className="space-y-2">
                {result.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start">
                    <span className="mr-2">•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Explanation Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Fact Check Details</DialogTitle>
          </DialogHeader>
          
          {selectedIssue && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Flagged Text</h4>
                <p className="text-sm bg-muted p-3 rounded-lg">
                  {selectedIssue.text}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">Issue Explanation</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedIssue.explanation}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">Suggested Correction</h4>
                <p className="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  {selectedIssue.correction}
                </p>
              </div>
              
              {selectedIssue.sources && selectedIssue.sources.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Sources</h4>
                  <div className="space-y-2">
                    {selectedIssue.sources.map((source: any, index: number) => (
                      <a
                        key={index}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary hover:underline flex items-center"
                      >
                        {source.title}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="outline" size="sm">
                  Report Issue
                </Button>
                <Button size="sm">
                  Accept Correction
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
