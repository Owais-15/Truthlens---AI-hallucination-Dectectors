import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Navigation } from '@/components/navigation';
import { Sidebar } from '@/components/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Crown
} from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/user/stats'],
  });

  const { data: usage } = useQuery({
    queryKey: ['/api/user/usage'],
  });

  const { data: recentAnalyses } = useQuery({
    queryKey: ['/api/analysis/history'],
  });

  const handleSaveProfile = async () => {
    try {
      const response = await apiRequest('PUT', '/api/user/profile', editForm);
      const data = await response.json();
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
      setIsEditing(false);
      
      // Refresh user data if needed
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSendEmailVerification = async () => {
    try {
      await apiRequest('POST', '/api/auth/send-verification');
      toast({
        title: 'Verification Email Sent',
        description: 'Please check your email for verification instructions.',
      });
    } catch (error) {
      toast({
        title: 'Failed to Send Email',
        description: 'Unable to send verification email. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSetup2FA = async () => {
    try {
      const response = await apiRequest('POST', '/api/user/2fa/setup');
      const data = await response.json();
      
      // For now, just show success message
      // In a real app, you'd show the QR code and setup flow
      toast({
        title: '2FA Setup',
        description: 'Two-factor authentication setup initiated. Check your authenticator app.',
      });
    } catch (error) {
      toast({
        title: '2FA Setup Failed',
        description: 'Unable to setup 2FA. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleExportData = async () => {
    try {
      const response = await apiRequest('GET', '/api/user/export');
      const data = await response.json();
      
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `truthlens-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Data Exported',
        description: 'Your data has been downloaded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Unable to export data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const usagePercent = usage ? (usage.usage.current / usage.usage.limit) * 100 : 0;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="text-2xl">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl">{user.name}</CardTitle>
                      <p className="text-muted-foreground flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {user.email}
                      </p>
                      <div className="flex items-center mt-2">
                        <Badge variant="outline" className="mr-2">
                          <Crown className="w-3 h-3 mr-1" />
                          Free Plan
                        </Badge>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Joined {new Date(user.createdAt || '').toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Personal Information</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                        data-testid="button-edit-profile"
                      >
                        {isEditing ? 'Cancel' : 'Edit'}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        {isEditing ? (
                          <Input
                            id="name"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            data-testid="input-edit-name"
                          />
                        ) : (
                          <p className="text-sm py-2" data-testid="text-display-name">{user.name}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        {isEditing ? (
                          <Input
                            id="email"
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            data-testid="input-edit-email"
                          />
                        ) : (
                          <p className="text-sm py-2" data-testid="text-display-email">{user.email}</p>
                        )}
                      </div>
                    </div>
                    
                    {isEditing && (
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveProfile} data-testid="button-save-profile">
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Usage Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg mx-auto mb-2">
                        <TrendingUp className="text-blue-600 dark:text-blue-400 h-6 w-6" />
                      </div>
                      <p className="text-2xl font-bold" data-testid="profile-stat-total">{stats?.stats.totalAnalyses || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Analyses</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg mx-auto mb-2">
                        <CheckCircle className="text-green-600 dark:text-green-400 h-6 w-6" />
                      </div>
                      <p className="text-2xl font-bold" data-testid="profile-stat-accuracy">
                        {stats?.stats.avgAccuracy ? `${Math.round(stats.stats.avgAccuracy)}%` : '0%'}
                      </p>
                      <p className="text-sm text-muted-foreground">Avg. Accuracy</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg mx-auto mb-2">
                        <AlertTriangle className="text-red-600 dark:text-red-400 h-6 w-6" />
                      </div>
                      <p className="text-2xl font-bold" data-testid="profile-stat-issues">{stats?.stats.issuesFound || 0}</p>
                      <p className="text-sm text-muted-foreground">Issues Found</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Analyses */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Analyses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentAnalyses?.analyses?.slice(0, 5).map((analysis: any, index: number) => {
                      const scoreColor = analysis.factualityScore >= 80 ? 'text-green-600' :
                                        analysis.factualityScore >= 60 ? 'text-orange-600' : 'text-red-600';
                      
                      return (
                        <div key={analysis.id} className="flex items-center space-x-4 p-3 border rounded-lg" data-testid={`recent-analysis-${index}`}>
                          <div className="flex-1">
                            <p className="text-sm font-medium line-clamp-2">
                              {analysis.content.substring(0, 100)}...
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(analysis.createdAt).toLocaleDateString()} at {new Date(analysis.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${scoreColor}`}>
                              {analysis.factualityScore}/100
                            </p>
                            <p className="text-xs text-muted-foreground">Score</p>
                          </div>
                        </div>
                      );
                    })}
                    
                    {(!recentAnalyses?.analyses || recentAnalyses.analyses.length === 0) && (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No analyses yet</p>
                        <p className="text-sm text-muted-foreground">Start analyzing content to see your history here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Current Usage */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Monthly Analyses</span>
                        <span className="font-medium" data-testid="usage-display">
                          {usage?.usage.current || 0}/{usage?.usage.limit || 100}
                        </span>
                      </div>
                      <Progress value={usagePercent} className="h-2" />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Plan Benefits</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• {usage?.usage.limit || 100} analyses per month</li>
                        <li>• Basic fact-checking</li>
                        <li>• PDF reports</li>
                        <li>• Email support</li>
                      </ul>
                    </div>
                    
                    <Button className="w-full" variant="outline" data-testid="button-upgrade-plan">
                      Upgrade Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Account Security */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email Verified</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant={user.emailVerified ? "default" : "secondary"}>
                          {user.emailVerified ? "Verified" : "Pending"}
                        </Badge>
                        {!user.emailVerified && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleSendEmailVerification}
                            data-testid="button-send-verification"
                          >
                            Send Email
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Two-Factor Auth</span>
                      <Badge variant={user.twoFactorEnabled ? "default" : "secondary"}>
                        {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full" data-testid="button-change-password">
                        Change Password
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full" 
                        onClick={handleSetup2FA}
                        data-testid="button-enable-2fa"
                      >
                        {user.twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Export */}
              <Card>
                <CardHeader>
                  <CardTitle>Data & Privacy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Download your data or manage your privacy settings.
                    </p>
                    
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full" 
                        onClick={handleExportData}
                        data-testid="button-export-data"
                      >
                        Export My Data
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full" 
                        onClick={() => window.location.href = '/privacy'}
                        data-testid="button-privacy-settings"
                      >
                        Privacy Settings
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <Button variant="destructive" size="sm" className="w-full" data-testid="button-delete-account">
                      Delete Account
                    </Button>
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
