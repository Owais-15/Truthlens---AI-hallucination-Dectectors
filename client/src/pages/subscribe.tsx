import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: "monthly" | "yearly";
  features: string[];
  analysesPerMonth: number;
  popular?: boolean;
}

const plans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "monthly",
    analysesPerMonth: 10,
    features: [
      "10 fact-checks per month",
      "Basic analysis reports",
      "Email support",
      "Standard processing speed"
    ]
  },
  {
    id: "pro-monthly",
    name: "Pro",
    price: 19,
    interval: "monthly",
    analysesPerMonth: 500,
    popular: true,
    features: [
      "500 fact-checks per month",
      "Advanced analysis with sources",
      "Detailed PDF reports",
      "Priority processing",
      "Email & chat support",
      "API access",
      "Export data"
    ]
  },
  {
    id: "pro-yearly",
    name: "Pro Annual",
    price: 190,
    interval: "yearly",
    analysesPerMonth: 500,
    features: [
      "500 fact-checks per month",
      "Advanced analysis with sources",
      "Detailed PDF reports",
      "Priority processing",
      "Email & chat support",
      "API access",
      "Export data",
      "2 months free"
    ]
  },
  {
    id: "enterprise-monthly",
    name: "Enterprise",
    price: 99,
    interval: "monthly",
    analysesPerMonth: 10000,
    features: [
      "10,000 fact-checks per month",
      "Premium AI models",
      "Custom integrations",
      "White-label options",
      "Dedicated support",
      "SLA guarantee",
      "Custom reporting",
      "Team management"
    ]
  }
];

export default function Subscribe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const subscribeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest("POST", "/api/create-subscription", { planId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Subscription Updated",
          description: "Your subscription has been updated successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to process subscription",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (planId: string) => {
    if (planId === "free") {
      toast({
        title: "Free Plan",
        description: "You're already on the free plan!",
      });
      return;
    }
    setSelectedPlan(planId);
    subscribeMutation.mutate(planId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold tracking-tighter">Choose Your Plan</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Get accurate fact-checking with AI-powered analysis. Start free, upgrade anytime.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
            data-testid={`card-plan-${plan.id}`}
          >
            {plan.popular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                <Star className="w-3 h-3 mr-1" />
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center space-x-2">
                {plan.id === "enterprise-monthly" && <Zap className="w-5 h-5 text-yellow-500" />}
                <span>{plan.name}</span>
              </CardTitle>
              <div className="space-y-1">
                <div className="text-3xl font-bold">
                  ${plan.price}
                  <span className="text-lg font-normal text-gray-600 dark:text-gray-400">
                    /{plan.interval === "yearly" ? "year" : "month"}
                  </span>
                </div>
                {plan.interval === "yearly" && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Save ${(plan.price * 12) - plan.price}
                  </p>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {plan.analysesPerMonth.toLocaleString()} analyses/month
                </p>
              </div>
              
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button
                onClick={() => handleSubscribe(plan.id)}
                disabled={subscribeMutation.isPending && selectedPlan === plan.id}
                className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                variant={plan.id === "free" ? "outline" : "default"}
                data-testid={`button-subscribe-${plan.id}`}
              >
                {subscribeMutation.isPending && selectedPlan === plan.id ? (
                  <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                ) : plan.id === "free" ? (
                  "Current Plan"
                ) : (
                  `Subscribe to ${plan.name}`
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-16 max-w-4xl mx-auto">
        <Card data-testid="card-billing-info">
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Payment Security</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All payments are processed securely through Stripe. We never store your payment information.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Cancellation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cancel anytime from your account settings. You'll continue to have access until your billing period ends.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Usage Tracking</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track your monthly usage in the reports dashboard. Get notified when approaching limits.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Support</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get help with billing, technical issues, or feature requests through your account.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}