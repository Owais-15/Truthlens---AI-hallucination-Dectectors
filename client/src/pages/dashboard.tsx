import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Analyzer } from '@/components/analyzer';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/navigation';
import { Sidebar } from '@/components/sidebar';
import { TrendingUp, CheckCircle, AlertTriangle, History, Download, Settings } from 'lucide-react';

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['/api/user/stats'],
  });

  const { data: recentAnalyses } = useQuery({
    queryKey: ['/api/analysis/history'],
  });

  const { data: usage } = useQuery({
    queryKey: ['/api/user/usage'],
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 max-w-7xl mx-auto">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Analyses</p>
                    <p className="text-2xl font-bold" data-testid="stat-total-analyses">
                      {stats?.stats.totalAnalyses || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <TrendingUp className="text-blue-600 dark:text-blue-400 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Accuracy</p>
                    <p className="text-2xl font-bold" data-testid="stat-avg-accuracy">
                      {stats?.stats.avgAccuracy ? `${Math.round(stats.stats.avgAccuracy)}%` : '0%'}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle className="text-green-600 dark:text-green-400 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Issues Found</p>
                    <p className="text-2xl font-bold" data-testid="stat-issues-found">
                      {stats?.stats.issuesFound || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                    <AlertTriangle className="text-red-600 dark:text-red-400 h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Analyzer Section */}
            <div className="xl:col-span-2">
              <Analyzer />
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button variant="ghost" className="w-full justify-start" data-testid="button-recent-analyses">
                      <History className="mr-3 h-4 w-4" />
                      View Recent Analyses
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" data-testid="button-download-reports">
                      <Download className="mr-3 h-4 w-4" />
                      Download All Reports
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" data-testid="button-analysis-settings">
                      <Settings className="mr-3 h-4 w-4" />
                      Analysis Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {recentAnalyses?.analyses?.slice(0, 3).map((analysis: any, index: number) => {
                      const scoreColor = analysis.factualityScore >= 80 ? 'bg-green-500' :
                                        analysis.factualityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500';
                      
                      return (
                        <div key={analysis.id} className="flex items-center space-x-3" data-testid={`activity-${index}`}>
                          <div className={`w-2 h-2 ${scoreColor} rounded-full`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium line-clamp-1">
                              {analysis.content.substring(0, 40)}...
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Score: {analysis.factualityScore}/100 • {new Date(analysis.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    
                    {(!recentAnalyses?.analyses || recentAnalyses.analyses.length === 0) && (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No recent activity</p>
                      </div>
                    )}
                  </div>
                  
                  <Button variant="link" className="w-full mt-4 h-auto p-0" data-testid="button-view-all-activity">
                    View all activity
                  </Button>
                </CardContent>
              </Card>

              {/* API Status */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">System Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Gemini API</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Exa Search</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Database</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-xs text-muted-foreground">Connected</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
