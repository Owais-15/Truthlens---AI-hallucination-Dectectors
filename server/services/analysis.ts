import { analyzeContent, generateDetailedExplanation } from './gemini.js';
import { verifyFact, findSourcesForClaim } from './exa.js';

export interface ComprehensiveAnalysis {
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

export async function performComprehensiveAnalysis(content: string): Promise<ComprehensiveAnalysis> {
  try {
    // Step 1: Get initial analysis from Gemini
    const geminiAnalysis = await analyzeContent(content);
    
    // Step 2: Verify each issue with Exa search
    const enhancedIssues = await Promise.all(
      geminiAnalysis.issues.map(async (issue) => {
        try {
          // Verify the claim
          const verificationResult = await verifyFact(issue.text, content);
          
          // Find additional sources
          const sources = await findSourcesForClaim(issue.text);
          
          return {
            ...issue,
            sources: sources.map(source => ({
              title: source.title,
              url: source.url,
              snippet: source.snippet
            })),
            verificationResult: {
              isVerified: verificationResult.isVerified,
              confidence: verificationResult.confidence
            }
          };
        } catch (error) {
          console.error(`Error verifying issue: ${issue.text}`, error);
          return {
            ...issue,
            sources: [],
            verificationResult: {
              isVerified: false,
              confidence: 0
            }
          };
        }
      })
    );

    // Step 3: Adjust factuality score based on verification results
    const verifiedIssues = enhancedIssues.filter(issue => !issue.verificationResult.isVerified);
    const adjustedScore = Math.max(0, geminiAnalysis.factualityScore - (verifiedIssues.length * 5));

    // Step 4: Generate recommendations
    const recommendations = generateRecommendations(enhancedIssues);

    // Step 5: Create overall assessment
    const overallAssessment = generateOverallAssessment(adjustedScore, enhancedIssues);

    return {
      factualityScore: adjustedScore,
      issues: enhancedIssues,
      summary: geminiAnalysis.summary,
      overallAssessment,
      recommendations
    };
  } catch (error) {
    console.error("Comprehensive analysis error:", error);
    throw new Error(`Analysis failed: ${error}`);
  }
}

function generateRecommendations(issues: any[]): string[] {
  const recommendations: string[] = [];
  
  const highSeverityCount = issues.filter(i => i.severity === 'high').length;
  const mediumSeverityCount = issues.filter(i => i.severity === 'medium').length;
  const lowSeverityCount = issues.filter(i => i.severity === 'low').length;

  if (highSeverityCount > 0) {
    recommendations.push(`Address ${highSeverityCount} critical factual error(s) immediately`);
  }
  
  if (mediumSeverityCount > 0) {
    recommendations.push(`Review and verify ${mediumSeverityCount} questionable claim(s)`);
  }
  
  if (lowSeverityCount > 0) {
    recommendations.push(`Consider clarifying ${lowSeverityCount} minor issue(s) for accuracy`);
  }

  if (issues.length === 0) {
    recommendations.push('Content appears factually sound based on current analysis');
  }

  recommendations.push('Always cross-reference claims with authoritative sources');
  recommendations.push('Consider adding source citations for verifiability');

  return recommendations;
}

function generateOverallAssessment(score: number, issues: any[]): string {
  if (score >= 90) {
    return 'Excellent factual accuracy with minimal issues detected.';
  } else if (score >= 75) {
    return 'Good factual accuracy with some minor issues to address.';
  } else if (score >= 60) {
    return 'Moderate factual accuracy with several concerns requiring attention.';
  } else if (score >= 40) {
    return 'Poor factual accuracy with significant issues that need correction.';
  } else {
    return 'Very poor factual accuracy with major factual errors throughout.';
  }
}
