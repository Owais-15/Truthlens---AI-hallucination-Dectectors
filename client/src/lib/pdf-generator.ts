import jsPDF from 'jspdf';

interface PDFData {
  analysisId: string;
  factualityScore: number;
  issues: Array<{
    text: string;
    severity: 'low' | 'medium' | 'high';
    explanation: string;
    correction: string;
    sources: Array<{
      title: string;
      url: string;
    }>;
  }>;
  summary: string;
  overallAssessment: string;
  recommendations: string[];
}

export async function generatePDFReport(data: PDFData, originalContent: string): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to add text with wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize = 12) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * fontSize * 0.35);
  };

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('TruthLens Analysis Report', margin, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
  yPosition += 10;

  doc.text(`Analysis ID: ${data.analysisId}`, margin, yPosition);
  yPosition += 20;

  // Factuality Score
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Factuality Score', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(24);
  const scoreColor = data.factualityScore >= 80 ? [34, 197, 94] : 
                    data.factualityScore >= 60 ? [251, 146, 60] : [239, 68, 68];
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`${data.factualityScore}/100`, margin, yPosition);
  doc.setTextColor(0, 0, 0);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  yPosition = addWrappedText(data.overallAssessment, margin, yPosition, contentWidth);
  yPosition += 15;

  // Summary
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Analysis Summary', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  yPosition = addWrappedText(data.summary, margin, yPosition, contentWidth);
  yPosition += 15;

  // Issues
  if (data.issues.length > 0) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Issues Detected', margin, yPosition);
    yPosition += 15;

    data.issues.forEach((issue, index) => {
      // Check if we need a new page
      if (yPosition > doc.internal.pageSize.height - 50) {
        doc.addPage();
        yPosition = margin;
      }

      // Issue severity badge
      const severityColors = {
        high: [239, 68, 68],
        medium: [251, 146, 60],
        low: [234, 179, 8]
      };
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(severityColors[issue.severity][0], severityColors[issue.severity][1], severityColors[issue.severity][2]);
      doc.text(`${issue.severity.toUpperCase()} SEVERITY`, margin, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 8;

      // Flagged text
      doc.setFont('helvetica', 'bold');
      doc.text('Flagged Text:', margin, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      yPosition = addWrappedText(issue.text, margin, yPosition, contentWidth, 10);
      yPosition += 8;

      // Explanation
      doc.setFont('helvetica', 'bold');
      doc.text('Explanation:', margin, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      yPosition = addWrappedText(issue.explanation, margin, yPosition, contentWidth, 10);
      yPosition += 8;

      // Correction
      doc.setFont('helvetica', 'bold');
      doc.text('Suggested Correction:', margin, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      yPosition = addWrappedText(issue.correction, margin, yPosition, contentWidth, 10);
      yPosition += 8;

      // Sources
      if (issue.sources.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Sources:', margin, yPosition);
        yPosition += 6;

        doc.setFont('helvetica', 'normal');
        issue.sources.forEach((source) => {
          yPosition = addWrappedText(`• ${source.title}`, margin + 5, yPosition, contentWidth - 5, 9);
          yPosition = addWrappedText(`  ${source.url}`, margin + 5, yPosition, contentWidth - 5, 8);
          yPosition += 3;
        });
      }

      yPosition += 10;
    });
  }

  // Recommendations
  if (data.recommendations.length > 0) {
    // Check if we need a new page
    if (yPosition > doc.internal.pageSize.height - 80) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommendations', margin, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    data.recommendations.forEach((recommendation) => {
      yPosition = addWrappedText(`• ${recommendation}`, margin, yPosition, contentWidth);
      yPosition += 8;
    });
  }

  // Original Content (if space allows)
  if (yPosition < doc.internal.pageSize.height - 100) {
    yPosition += 10;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Original Content', margin, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    yPosition = addWrappedText(originalContent, margin, yPosition, contentWidth, 10);
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    (doc as any).setPage(i);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Generated by TruthLens - AI Fact Checking Platform',
      margin,
      doc.internal.pageSize.height - 15
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin - 30,
      doc.internal.pageSize.height - 15
    );
  }

  // Save the PDF
  const fileName = `TruthLens-Analysis-${data.analysisId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
