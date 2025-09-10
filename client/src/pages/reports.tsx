import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigation } from '@/components/navigation';
import { Sidebar } from '@/components/sidebar';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { generatePDFReport } from '@/lib/pdf-generator';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Download, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  Share
} from 'lucide-react';

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const { toast } = useToast();

  const { data: analyses } = useQuery({
    queryKey: ['/api/analysis/history'],
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/user/stats'],
  });

  // Process data for charts
  const processAnalyticsData = () => {
    if (!analyses?.analyses) return null;

    const analysisData = analyses.analyses;
    
    // Score distribution
    const scoreDistribution = [
      { name: '90-100', count: analysisData.filter((a: any) => a.factualityScore >= 90).length, color: '#10b981' },
      { name: '80-89', count: analysisData.filter((a: any) => a.factualityScore >= 80 && a.factualityScore < 90).length, color: '#6366f1' },
      { name: '70-79', count: analysisData.filter((a: any) => a.factualityScore >= 70 && a.factualityScore < 80).length, color: '#f59e0b' },
      { name: '60-69', count: analysisData.filter((a: any) => a.factualityScore >= 60 && a.factualityScore < 70).length, color: '#f97316' },
      { name: '<60', count: analysisData.filter((a: any) => a.factualityScore < 60).length, color: '#ef4444' },
    ];

    // Issues breakdown
    const issueBreakdown = [
      { name: 'High Severity', value: analysisData.reduce((sum: number, a: any) => 
        sum + (a.results?.issues?.filter((i: any) => i.severity === 'high').length || 0), 0), color: '#ef4444' },
      { name: 'Medium Severity', value: analysisData.reduce((sum: number, a: any) => 
        sum + (a.results?.issues?.filter((i: any) => i.severity === 'medium').length || 0), 0), color: '#f97316' },
      { name: 'Low Severity', value: analysisData.reduce((sum: number, a: any) => 
        sum + (a.results?.issues?.filter((i: any) => i.severity === 'low').length || 0), 0), color: '#eab308' },
    ];

    // Weekly trend (last 4 weeks)
    const weeklyTrend = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const weekAnalyses = analysisData.filter((a: any) => {
        const date = new Date(a.createdAt);
        return date >= weekStart && date < weekEnd;
      });
      
      const avgScore = weekAnalyses.length > 0 
        ? weekAnalyses.reduce((sum: number, a: any) => sum + a.factualityScore, 0) / weekAnalyses.length
        : 0;
      
      weeklyTrend.push({
        week: `Week ${4 - i}`,
        analyses: weekAnalyses.length,
        avgScore: Math.round(avgScore),
      });
    }

    return { scoreDistribution, issueBreakdown, weeklyTrend };
  };

  const analyticsData = processAnalyticsData();

  const handleExportSummaryReport = async () => {
    try {
      // Create a comprehensive summary report
      const summaryData = {
        analysisId: 'summary-report',
        factualityScore: Math.round(stats?.stats.avgAccuracy || 0),
        issues: [],
        summary: `Comprehensive analysis summary for ${analyses?.analyses?.length || 0} analyses. Average factuality score: ${Math.round(stats?.stats.avgAccuracy || 0)}%. Total issues found: ${stats?.stats.issuesFound || 0}.`,
        overallAssessment: `Based on ${analyses?.analyses?.length || 0} analyses, your content shows ${
          (stats?.stats.avgAccuracy || 0) >= 80 ? 'excellent' : 
          (stats?.stats.avgAccuracy || 0) >= 60 ? 'good' : 'concerning'
        } factual accuracy.`,
        recommendations: [
          'Continue fact-checking AI-generated content',
          'Focus on sources with lower accuracy scores',
          'Implement regular content audits',
          'Consider additional verification for critical claims'
        ]
      };

      await generatePDFReport(summaryData, 'Summary report for all analyses');
      toast({
        title: 'Summary Report Generated',
        description: 'Your comprehensive analysis report has been downloaded.',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to generate summary report.',
        variant: 'destructive',
      });
    }
  };

  const handleShareReport = async () => {
    try {
      await navigator.share({
        title: 'TruthLens Analysis Report',
        text: `My fact-checking summary: ${analyses?.analyses?.length || 0} analyses with ${Math.round(stats?.stats.avgAccuracy || 0)}% average accuracy`,
        url: window.location.href,
      });
    } catch (error) {
      toast({
        title: 'Share Report',
        description: 'Report link copied to clipboard.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 max-w-7xl mx-auto">
          <div className="space-y-6">
            <PageHeader 
              title="Reports & Analytics" 
              subtitle="Comprehensive insights into your fact-checking activity"
            />
            
            <div className="flex justify-end space-x-2 mb-4">
              <Button variant="outline" onClick={handleShareReport} data-testid="button-share-report">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button onClick={handleExportSummaryReport} data-testid="button-export-summary">
                <Download className="w-4 h-4 mr-2" />
                Export Summary
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <FileText className="text-blue-600 dark:text-blue-400 h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Reports</p>
                      <p className="text-2xl font-bold" data-testid="stat-total-reports">{analyses?.analyses?.length || 0}</p>
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
                      <p className="text-sm text-muted-foreground">Avg. Accuracy</p>
                      <p className="text-2xl font-bold" data-testid="stat-avg-accuracy">
                        {Math.round(stats?.stats.avgAccuracy || 0)}%
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
                      <p className="text-sm text-muted-foreground">Issues Found</p>
                      <p className="text-2xl font-bold" data-testid="stat-issues-found">{stats?.stats.issuesFound || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <TrendingUp className="text-purple-600 dark:text-purple-400 h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">This Month</p>
                      <p className="text-2xl font-bold" data-testid="stat-this-month">
                        {analyses?.analyses?.filter((a: any) => {
                          const date = new Date(a.createdAt);
                          const now = new Date();
                          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                        }).length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Tabs */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Analytics Dashboard</CardTitle>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-32" data-testid="select-period">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                    <TabsTrigger value="accuracy" data-testid="tab-accuracy">Accuracy Trends</TabsTrigger>
                    <TabsTrigger value="issues" data-testid="tab-issues">Issue Analysis</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Score Distribution */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Score Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={analyticsData?.scoreDistribution}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="count" fill="#3b82f6" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Issue Breakdown */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Issue Severity Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={analyticsData?.issueBreakdown}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {analyticsData?.issueBreakdown.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="accuracy" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Weekly Accuracy Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={analyticsData?.weeklyTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="week" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Line 
                              type="monotone" 
                              dataKey="avgScore" 
                              stroke="#3b82f6" 
                              strokeWidth={3}
                              name="Average Score"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="issues" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Weekly Analysis Volume</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={analyticsData?.weeklyTrend}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="week" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="analyses" fill="#10b981" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Quality Metrics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>High Quality (80%+)</span>
                              <span>{analyses?.analyses?.filter((a: any) => a.factualityScore >= 80).length || 0} analyses</span>
                            </div>
                            <Progress 
                              value={((analyses?.analyses?.filter((a: any) => a.factualityScore >= 80).length || 0) / (analyses?.analyses?.length || 1)) * 100} 
                              className="h-2" 
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Medium Quality (60-79%)</span>
                              <span>{analyses?.analyses?.filter((a: any) => a.factualityScore >= 60 && a.factualityScore < 80).length || 0} analyses</span>
                            </div>
                            <Progress 
                              value={((analyses?.analyses?.filter((a: any) => a.factualityScore >= 60 && a.factualityScore < 80).length || 0) / (analyses?.analyses?.length || 1)) * 100} 
                              className="h-2" 
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Low Quality (under 60%)</span>
                              <span>{analyses?.analyses?.filter((a: any) => a.factualityScore < 60).length || 0} analyses</span>
                            </div>
                            <Progress 
                              value={((analyses?.analyses?.filter((a: any) => a.factualityScore < 60).length || 0) / (analyses?.analyses?.length || 1)) * 100} 
                              className="h-2" 
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Content Quality Tips</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Focus on content with scores below 70% for improvement</li>
                      <li>• Verify claims with multiple authoritative sources</li>
                      <li>• Pay special attention to high-severity issues</li>
                      <li>• Regular fact-checking helps maintain quality</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Usage Insights</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Consistent daily analysis shows best results</li>
                      <li>• Export reports for stakeholder reviews</li>
                      <li>• Track improvement trends over time</li>
                      <li>• Share insights with your content team</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
