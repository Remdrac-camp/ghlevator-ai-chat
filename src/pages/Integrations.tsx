
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  Globe2,
  Webhook,
  KeyRound,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Integrations = () => {
  const { toast } = useToast();
  const [ghlApiKey, setGhlApiKey] = React.useState('');
  const [ghlSubdomain, setGhlSubdomain] = React.useState('');
  const [webhookEndpoint, setWebhookEndpoint] = React.useState('');
  const { apiKeys } = useAuth();

  React.useEffect(() => {
    // Set the webhook endpoint based on the current domain
    setWebhookEndpoint(`${window.location.origin}/api/ghl/webhook`);
  }, []);

  const handleConnect = () => {
    if (!ghlApiKey || !ghlSubdomain) {
      toast({
        title: "Missing Information",
        description: "Please provide both your GoHighLevel API key and subdomain.",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically validate and save the GHL credentials
    toast({
      title: "Integration Successful",
      description: "Your GoHighLevel account has been connected successfully.",
    });
  };

  return (
    <Layout requiresAuth>
      <div className="container mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Connect your GoHighLevel account to enable chatbot integration
          </p>
        </header>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe2 className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>GoHighLevel Connection</CardTitle>
                <CardDescription>
                  Configure your GoHighLevel integration settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your GoHighLevel API key"
                  value={ghlApiKey}
                  onChange={(e) => setGhlApiKey(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Find your API key in your GoHighLevel account settings
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <div className="flex gap-2">
                  <Input
                    id="subdomain"
                    placeholder="your-agency"
                    value={ghlSubdomain}
                    onChange={(e) => setGhlSubdomain(e.target.value)}
                  />
                  <span className="flex items-center text-muted-foreground">.gohighlevel.com</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Webhook className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Webhook Configuration</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Copy this webhook URL to your GoHighLevel integration settings
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={webhookEndpoint}
                      readOnly
                      className="bg-background font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(webhookEndpoint);
                        toast({
                          title: "Copied!",
                          description: "Webhook URL copied to clipboard",
                        });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleConnect} className="gap-2">
                <span>Connect GoHighLevel</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Integration Status</CardTitle>
                <CardDescription>
                  Current status of your GoHighLevel integration
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  <span>API Connection</span>
                </div>
                <span className={apiKeys.goHighLevel ? "text-green-500" : "text-yellow-500"}>
                  {apiKeys.goHighLevel ? "Connected" : "Not Connected"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Webhook className="h-4 w-4 text-muted-foreground" />
                  <span>Webhook Status</span>
                </div>
                <span className="text-yellow-500">Pending Setup</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Integrations;
