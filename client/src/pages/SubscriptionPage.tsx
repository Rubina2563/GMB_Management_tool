import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

export default function SubscriptionPage() {
  const { user, subscriptionPlan, subscriptionStatus, subscriptionExpiry } = useAuth();
  const { toast } = useToast();

  // Mock mutation for updating subscription
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ plan }: { plan: string }) => {
      const res = await apiRequest("POST", "/api/subscription/update", { plan });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Subscription updated",
        description: "Your subscription has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update subscription",
        description: error.message || "An error occurred while updating your subscription",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (plan: string) => {
    // In a real implementation, this would open a payment modal or redirect to payment gateway
    toast({
      title: "Processing subscription",
      description: `Setting up your ${plan} subscription...`,
    });
    
    // For demo, just update the subscription directly
    updateSubscriptionMutation.mutate({ plan });
  };

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
          <p className="text-muted-foreground mt-2">
            Choose the plan that best fits your needs
          </p>
        </div>

        {/* Current subscription status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>Your active subscription details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">Plan</div>
                <div className="capitalize">{subscriptionPlan || "Free"}</div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="font-medium">Status</div>
                <Badge 
                  variant={subscriptionStatus === "active" ? "default" : "destructive"}
                  className="capitalize"
                >
                  {subscriptionStatus || "None"}
                </Badge>
              </div>
              {subscriptionExpiry && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Expires</div>
                    <div>{subscriptionExpiry.toLocaleDateString()}</div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Free Plan */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Basic access with limited features</CardDescription>
              <div className="mt-4 text-4xl font-bold">$0</div>
              <p className="text-sm text-muted-foreground">Forever free</p>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>Limited API access</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>Basic analytics</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>Community support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                disabled={subscriptionPlan === "free" || subscriptionPlan === null}
                onClick={() => handleSubscribe("free")}
              >
                {subscriptionPlan === "free" || subscriptionPlan === null ? "Current Plan" : "Downgrade"}
              </Button>
            </CardFooter>
          </Card>

          {/* Basic Plan */}
          <Card className="flex flex-col border-primary border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Basic</CardTitle>
                <Badge>Popular</Badge>
              </div>
              <CardDescription>Advanced features for professionals</CardDescription>
              <div className="mt-4 text-4xl font-bold">$49</div>
              <p className="text-sm text-muted-foreground">per month</p>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>Unlimited API access</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>Detailed analytics & reports</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>Email support</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>API key management</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                disabled={subscriptionPlan === "basic"}
                onClick={() => handleSubscribe("basic")}
              >
                {subscriptionPlan === "basic" ? "Current Plan" : "Subscribe"}
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Plan */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>Enterprise-grade solutions</CardDescription>
              <div className="mt-4 text-4xl font-bold">$99</div>
              <p className="text-sm text-muted-foreground">per month</p>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>Everything in Basic</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>Priority API access</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>24/7 priority support</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>Dedicated account manager</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                disabled={subscriptionPlan === "pro"}
                onClick={() => handleSubscribe("pro")}
              >
                {subscriptionPlan === "pro" ? "Current Plan" : "Subscribe"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}