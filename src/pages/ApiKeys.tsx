
import React from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
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
import { Key, Shield } from 'lucide-react';

const ApiKeys = () => {
  const { apiKeys, updateApiKeys } = useAuth();
  const [openaiKey, setOpenaiKey] = React.useState(apiKeys.openai);
  const [ghlKey, setGhlKey] = React.useState(apiKeys.goHighLevel);
  const [showOpenai, setShowOpenai] = React.useState(false);
  const [showGhl, setShowGhl] = React.useState(false);

  const handleSave = () => {
    updateApiKeys({
      openai: openaiKey,
      goHighLevel: ghlKey
    });
    
    alert('API keys updated successfully!');
  };

  return (
    <Layout requiresAuth>
      <div className="container mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">
            Securely manage your API connections
          </p>
        </header>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2" /> OpenAI API Key
            </CardTitle>
            <CardDescription>
              Required for ChatGPT integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <Shield className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-sm text-blue-600">Your API keys are stored securely in your browser</span>
              </div>
              
              <div className="flex">
                <Input
                  type={showOpenai ? "text" : "password"}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="ml-2"
                  onClick={() => setShowOpenai(!showOpenai)}
                >
                  {showOpenai ? "Hide" : "Show"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Get your API key from the <a href="https://platform.openai.com/account/api-keys" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">OpenAI dashboard</a>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2" /> GoHighLevel API Key
            </CardTitle>
            <CardDescription>
              Required for GoHighLevel integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex">
                <Input
                  type={showGhl ? "text" : "password"}
                  value={ghlKey}
                  onChange={(e) => setGhlKey(e.target.value)}
                  placeholder="Enter your GoHighLevel API key"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="ml-2"
                  onClick={() => setShowGhl(!showGhl)}
                >
                  {showGhl ? "Hide" : "Show"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Get your API key from the GoHighLevel settings page
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave}>
            Save API Keys
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default ApiKeys;
