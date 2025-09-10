export interface ExaSearchResult {
  title: string;
  url: string;
  snippet: string;
  score: number;
}

export interface FactVerificationResult {
  isVerified: boolean;
  confidence: number;
  sources: ExaSearchResult[];
  conflictingSources: ExaSearchResult[];
}

export async function searchForFacts(query: string): Promise<ExaSearchResult[]> {
  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EXA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        num_results: 10,
        include_domains: [
          'wikipedia.org',
          'britannica.com',
          'reuters.com',
          'bbc.com',
          'cnn.com',
          'npr.org',
          'nationalgeographic.com',
          'smithsonianmag.com',
          'nature.com',
          'science.org'
        ],
        use_autoprompt: true,
        contents: {
          text: true,
          highlights: {
            num_sentences: 3,
            highlights_per_url: 2
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Exa API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.results?.map((result: any) => ({
      title: result.title,
      url: result.url,
      snippet: result.text?.substring(0, 200) + '...' || '',
      score: result.score || 0
    })) || [];
  } catch (error) {
    console.error("Exa search error:", error);
    return [];
  }
}

export async function verifyFact(claim: string, context: string): Promise<FactVerificationResult> {
  try {
    // Search for supporting evidence
    const supportingQuery = `facts about: ${claim}`;
    const supportingSources = await searchForFacts(supportingQuery);
    
    // Search for contradictory evidence
    const contradictoryQuery = `myth debunked: ${claim}`;
    const conflictingSources = await searchForFacts(contradictoryQuery);
    
    // Calculate confidence based on source quality and consensus
    const highQualitySources = supportingSources.filter(source => 
      source.url.includes('wikipedia') || 
      source.url.includes('britannica') ||
      source.url.includes('reuters') ||
      source.url.includes('bbc')
    );
    
    const hasStrongSupport = highQualitySources.length >= 2;
    const hasConflictingEvidence = conflictingSources.length > 0;
    
    let confidence = 50; // Base confidence
    
    if (hasStrongSupport) confidence += 30;
    if (supportingSources.length >= 5) confidence += 10;
    if (hasConflictingEvidence) confidence -= 20;
    if (conflictingSources.length >= 3) confidence -= 20;
    
    confidence = Math.max(0, Math.min(100, confidence));
    
    return {
      isVerified: confidence >= 70,
      confidence,
      sources: supportingSources.slice(0, 5),
      conflictingSources: conflictingSources.slice(0, 3)
    };
  } catch (error) {
    console.error("Fact verification error:", error);
    return {
      isVerified: false,
      confidence: 0,
      sources: [],
      conflictingSources: []
    };
  }
}

export async function findSourcesForClaim(claim: string): Promise<ExaSearchResult[]> {
  const sources = await searchForFacts(claim);
  return sources.slice(0, 5); // Return top 5 sources
}
