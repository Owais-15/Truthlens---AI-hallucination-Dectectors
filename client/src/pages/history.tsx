import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigation } from '@/components/navigation';
import { Sidebar } from '@/components/sidebar';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { generatePDFReport } from '@/lib/pdf-generator';
import { 
  Search, 
  Download, 
  Filter, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function History() {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const { toast } = useToast();

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['/api/analysis/history'],
  });

  const filteredAnalyses = analyses?.analyses?.filter((analysis: any) => {
    const matchesSearch = analysis.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (severityFilter === 'all') return matchesSearch;
    
    const hasHighSeverity = analysis.results?.issues?.some((issue: any) => issue.severity === 'high');
    const hasMediumSeverity = analysis.results?.issues?.some((issue: any) => issue.severity === 'medium');
    const hasLowSeverity = analysis.results?.issues?.some((issue: any) => issue.severity === 'low');
    
    switch (severityFilter) {
      case 'high': return matchesSearch && hasHighSeverity;
      case 'medium': return matchesSearch && hasMediumSeverity;
      case 'low': return matchesSearch && hasLowSeverity;
      case 'clean': return matchesSearch && !hasHighSeverity && !hasMediumSeverity && !hasLowSeverity;
      default: return matchesSearch;
    }
  }) || [];

  const sortedAnalyses = [...filteredAnalyses].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'score':
        return b.factualityScore - a.factualityScore;
      case 'issues':
        return (b.results?.issues?.length || 0) - (a.results?.issues?.length || 0);
      default:
        return 0;
    }
  });

  const handleExportPDF = async (analysis: any) => {
    try {
      await generatePDFReport(analysis.results, analysis.content);
      toast({
        title: 'PDF Generated',
        description: 'Analysis report has been downloaded.',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to generate PDF report.',
        variant: 'destructive',
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900';
    if (score >= 60) return 'text-orange-600 bg-orange-100 dark:bg-orange-900';
    return 'text-red-600 bg-red-100 dark:bg-red-900';
  };

  const getSeverityBadge = (issues: any[]) => {
    if (!issues || issues.length === 0) {
      return <Badge variant="outline" className="text-green-600">Clean</Badge>;
    }
    
    const hasHigh = issues.some(issue => issue.severity === 'high');
    const hasMedium = issues.some(issue => issue.severity === 'medium');
    
    if (hasHigh) {
      return <Badge variant="destructive">High Risk</Badge>;
    } else if (hasMedium) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Medium Risk</Badge>;
    } else {
      return <Badge variant="outline" className="text-yellow-600">Low Risk</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 max-w-7xl mx-auto">
          <div className="space-y-6">
            <PageHeader 
              title="Analysis History" 
              subtitle="View and manage your past fact-checking analyses"
            />
            
            <div className="flex justify-end mb-4">
              <Button variant="outline" data-testid="button-export-all">
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Calendar className="text-blue-600 dark:text-blue-400 h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Analyses</p>
                      <p className="text-2xl font-bold" data-testid="stat-total">{analyses?.analyses?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                      <CheckCircle className="text-green-600 dark:text-green-400 h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">High Quality</p>
                      <p className="text-2xl font-bold" data-testid="stat-high-quality">
                        {analyses?.analyses?.filter((a: any) => a.factualityScore >= 80).length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                      <AlertTriangle className="text-red-600 dark:text-red-400 h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Need Review</p>
                      <p className="text-2xl font-bold" data-testid="stat-need-review">
                        {analyses?.analyses?.filter((a: any) => a.factualityScore < 60).length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search analyses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>
                  
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger data-testid="select-severity">
                      <SelectValue placeholder="Filter by severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="clean">Clean</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger data-testid="select-sort">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date (Newest)</SelectItem>
                      <SelectItem value="score">Factuality Score</SelectItem>
                      <SelectItem value="issues">Issue Count</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Results Table */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results ({sortedAnalyses.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {sortedAnalyses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Content Preview</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Risk Level</TableHead>
                        <TableHead>Issues</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAnalyses.map((analysis: any, index: number) => (
                        <TableRow key={analysis.id} data-testid={`analysis-row-${index}`}>
                          <TableCell className="max-w-md">
                            <p className="line-clamp-2 text-sm">
                              {analysis.content.substring(0, 100)}...
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{new Date(analysis.createdAt).toLocaleDateString()}</p>
                              <p className="text-muted-foreground">
                                {new Date(analysis.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getScoreColor(analysis.factualityScore)}>
                              {analysis.factualityScore}/100
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getSeverityBadge(analysis.results?.issues)}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">
                              {analysis.results?.issues?.length || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExportPDF(analysis)}
                                data-testid={`button-export-${index}`}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No analyses found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || severityFilter !== 'all' 
                        ? 'Try adjusting your filters or search terms'
                        : 'Start analyzing content to see your history here'
                      }
                    </p>
                    <Button variant="outline" onClick={() => {
                      setSearchTerm('');
                      setSeverityFilter('all');
                    }}>
                      Clear Filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
