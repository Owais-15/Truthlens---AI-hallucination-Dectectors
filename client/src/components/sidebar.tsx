import React from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Microscope, History, FileText, User, CreditCard } from 'lucide-react';

export function Sidebar() {
  const [location] = useLocation();

  const { data: usage } = useQuery({
    queryKey: ['/api/user/usage'],
  });

  const navItems = [
    { href: '/dashboard', icon: Microscope, label: 'Analyzer' },
    { href: '/history', icon: History, label: 'History' },
    { href: '/reports', icon: FileText, label: 'Reports' },
    { href: '/subscribe', icon: CreditCard, label: 'Upgrade' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  const usagePercent = usage ? (usage.usage.current / usage.usage.limit) * 100 : 0;

  return (
    <aside className="w-64 bg-card border-r border-border min-h-[calc(100vh-4rem)] hidden lg:block">
      <div className="p-6">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href || 
              (item.href === '/dashboard' && (location === '/' || location === '/dashboard'));
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold text-sm mb-2">Usage This Month</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Analyses</span>
              <span className="font-medium" data-testid="usage-count">
                {usage?.usage.current || 0}/{usage?.usage.limit || 100}
              </span>
            </div>
            <Progress value={usagePercent} className="h-2" />
          </div>
        </div>
      </div>
    </aside>
  );
}
