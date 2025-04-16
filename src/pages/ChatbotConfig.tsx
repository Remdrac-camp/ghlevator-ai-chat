import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatbot } from '@/contexts/ChatbotContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Objective, GhlAccount } from '@/types';
import { Slider } from '@/components/ui/slider';
import { AlertCircle, Save, Target, Bot, Webhook, MessageCircle, LinkIcon, Building } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { GhlFieldMappings } from '@/components/GhlFieldMappings';
import { useToast } from '@/hooks/use-toast';

const objectiveSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  fieldToExtract: z.string().min(1, 'Field to extract is required'),
  pattern: z.string().optional(),
  order: z.number(),
});

const ChatbotConfig = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    chatbots, 
    updateChatbot, 
    addObjective, 
    updateObjective, 
    removeObjective,
    goHighLevelConfig,
    ghlSubAccounts = [],
    linkChatbotToGhlAccount,
    getLinkedGhlAccount 
  } = useChatbot();
  const { apiKeys, updateApiKeys } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic');
  const [newObjective, setNewObjective] = useState<Omit<Objective, 'id' | 'completed'>>({
    name: '',
    description: '',
    fieldToExtract: '',
    pattern: '',
    order: 0
  });
  const [openaiKey, setOpenaiKey] = useState(apiKeys.openai || '');
  const [selectedGhlAccountId, setSelectedGhlAccountId] = useState<string | null>(null);

  const chatbot = chatbots.find(c => c.id === id);

  useEffect(() => {
    if (!chatbot) {
      navigate('/dashboard');
    } else {
      const linkedAccount = getLinkedGhlAccount(chatbot.id);
      setSelectedGhlAccountId(linkedAccount?.id || null);
    }
  }, [chatbot, navigate, getLinkedGhlAccount]);

  const form = useForm({
    defaultValues: {
      name: chatbot?.name || '',
      description: chatbot?.description || '',
      welcomeMessage: chatbot?.welcomeMessage || '',
      systemPrompt: chatbot?.systemPrompt || '',
      model: chatbot?.openaiParams.model || 'gpt-4o',
      temperature: chatbot?.openaiParams.temperature || 0.7,
      maxTokens: chatbot?.openaiParams.maxTokens || 500,
    },
  });

  const allGhlAccounts: Array<GhlAccount | {id: 'main', name: string}> = [
    ...(goHighLevelConfig ? [{ id: 'main', name: 'Compte Principal GHL' }] : []),
    ...ghlSubAccounts.filter(account => account.active)
  ];
  
  const handleSave = (data: any) => {
    if (!chatbot) return;
    
    updateChatbot(chatbot.id, {
      name: data.name,
      description: data.description,
      welcomeMessage: data.welcomeMessage,
      systemPrompt: data.systemPrompt,
      openaiParams: {
        ...chatbot.openaiParams,
        model: data.model,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
      }
    });
    
    toast({
      title: "Configuration sauvegardée",
      description: "Les paramètres du chatbot ont été enregistrés avec succès."
    });
  };

  const handleAddObjective = () => {
    if (!chatbot || !newObjective.name || !newObjective.fieldToExtract) return;
    
    addObjective(chatbot.id, {
      ...newObjective,
      completed: false
    });
    
    setNewObjective({
      name: '',
      description: '',
      fieldToExtract: '',
      pattern: '',
      order: (chatbot.objectives.length || 0)
    });
  };

  const handleRemoveObjective = (objectiveId: string) => {
    if (!chatbot) return;
    if (window.confirm('Are you sure you want to delete this objective?')) {
      removeObjective(chatbot.id, objectiveId);
    }
  };

  const handleLinkGhlAccount = (accountId: string) => {
    if (!chatbot) return;
    
    linkChatbotToGhlAccount(chatbot.id, accountId === 'none' ? null : accountId);
    setSelectedGhlAccountId(accountId === 'none' ? null : accountId);
    
    toast({
      title: accountId === 'none' 
        ? "Liaison supprimée" 
        : "Compte GHL lié",
      description: accountId === 'none'
        ? "Le chatbot n'est plus lié à un compte GoHighLevel."
        : "Le chatbot a été lié au compte GoHighLevel sélectionné."
    });
  };

  if (!chatbot) {
    return (
      <Layout requiresAuth>
        <div className="flex justify-center items-center h-64">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  const linkedAccount = getLinkedGhlAccount(chatbot.id);

  return (
    <Layout requiresAuth>
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{chatbot.name}</h1>
            <p className="text-muted-foreground">{chatbot.description}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate(`/chatbots/${chatbot.id}/test`)}>
              Test Chatbot
            </Button>
            <Button onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-6 mb-8">
            <TabsTrigger value="basic" className="flex items-center">
              <Bot className="mr-2 h-4 w-4" />
              Basic Settings
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center">
              <MessageCircle className="mr-2 h-4 w-4" />
              AI Config
            </TabsTrigger>
            <TabsTrigger value="objectives" className="flex items-center">
              <Target className="mr-2 h-4 w-4" />
              Objectives
            </TabsTrigger>
            <TabsTrigger value="ghl_link" className="flex items-center">
              <LinkIcon className="mr-2 h-4 w-4" />
              GHL Liaison
            </TabsTrigger>
            <TabsTrigger value="webhook" className="flex items-center">
              <Webhook className="mr-2 h-4 w-4" />
              Webhook
            </TabsTrigger>
            <TabsTrigger value="ghl" className="flex items-center">
              <Building className="mr-2 h-4 w-4" />
              GHL Mappings
            </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)}>
              <TabsContent value="basic">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Settings</CardTitle>
                    <CardDescription>
                      Configure the basic information for your chatbot
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Chatbot Name</Label>
                      <Input
                        id="name"
                        placeholder="Customer Support Assistant"
                        {...form.register('name')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="A brief description of your chatbot's purpose"
                        {...form.register('description')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="welcomeMessage">Welcome Message</Label>
                      <Textarea
                        id="welcomeMessage"
                        placeholder="Hello! How can I help you today?"
                        {...form.register('welcomeMessage')}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Configuration</CardTitle>
                    <CardDescription>
                      Configure the AI behavior and performance settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="openaiKey">OpenAI API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          id="openaiKey"
                          type="password"
                          value={openaiKey}
                          onChange={(e) => setOpenaiKey(e.target.value)}
                          placeholder="sk-..."
                          className="flex-1"
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            if (openaiKey) {
                              updateApiKeys({ ...apiKeys, openai: openaiKey });
                              alert('OpenAI API key saved successfully!');
                            }
                          }}
                        >
                          Save Key
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Your API key is stored securely in your browser's local storage
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="systemPrompt">System Prompt</Label>
                      <Textarea
                        id="systemPrompt"
                        placeholder="You are a helpful customer support assistant..."
                        className="min-h-32"
                        {...form.register('systemPrompt')}
                      />
                      <p className="text-sm text-muted-foreground">
                        This prompt sets the AI's behavior and context. Be specific about how the AI should respond.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Select defaultValue={form.watch('model')} onValueChange={value => form.setValue('model', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4o">GPT-4o (Most Capable)</SelectItem>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini (Faster, Lower Cost)</SelectItem>
                          <SelectItem value="gpt-4.5-preview">GPT-4.5 Preview (Advanced)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="temperature">Temperature: {form.watch('temperature')}</Label>
                      </div>
                      <Slider
                        defaultValue={[form.watch('temperature')]}
                        max={1}
                        step={0.1}
                        onValueChange={([value]) => form.setValue('temperature', value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Lower values make responses more deterministic, higher values more creative.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="maxTokens">Max Tokens: {form.watch('maxTokens')}</Label>
                      </div>
                      <Slider
                        defaultValue={[form.watch('maxTokens')]}
                        max={1000}
                        step={50}
                        onValueChange={([value]) => form.setValue('maxTokens', value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Maximum length of the response generated by the AI.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="objectives">
                <Card>
                  <CardHeader>
                    <CardTitle>Chatbot Objectives</CardTitle>
                    <CardDescription>
                      Define what information your chatbot should collect from users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="border rounded-md p-4">
                        <h3 className="text-lg font-medium mb-2">Add New Objective</h3>
                        <div className="grid gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="objective-name">Name</Label>
                            <Input
                              id="objective-name"
                              placeholder="Get Email Address"
                              value={newObjective.name}
                              onChange={(e) => setNewObjective({...newObjective, name: e.target.value})}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="objective-field">Field to Extract</Label>
                            <Input
                              id="objective-field"
                              placeholder="email"
                              value={newObjective.fieldToExtract}
                              onChange={(e) => setNewObjective({...newObjective, fieldToExtract: e.target.value})}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="objective-pattern">Regex Pattern (Optional)</Label>
                            <Input
                              id="objective-pattern"
                              placeholder="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                              value={newObjective.pattern || ''}
                              onChange={(e) => setNewObjective({...newObjective, pattern: e.target.value})}
                            />
                          </div>
                          <Button type="button" onClick={handleAddObjective}>Add Objective</Button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">Current Objectives</h3>
                        {chatbot.objectives.length === 0 ? (
                          <div className="text-center p-8 border border-dashed rounded-md">
                            <p className="text-muted-foreground">No objectives defined yet</p>
                          </div>
                        ) : (
                          <Accordion type="single" collapsible className="w-full">
                            {chatbot.objectives.map((objective, index) => (
                              <AccordionItem key={objective.id} value={objective.id}>
                                <AccordionTrigger>
                                  {`${index + 1}. ${objective.name}`}
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-2 p-2">
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <Label>Field to Extract</Label>
                                        <p className="text-sm font-medium">{objective.fieldToExtract}</p>
                                      </div>
                                      <div>
                                        <Label>Pattern</Label>
                                        <p className="text-sm font-mono">{objective.pattern || 'None'}</p>
                                      </div>
                                      <div>
                                        <Label>Order</Label>
                                        <p className="text-sm">{objective.order + 1}</p>
                                      </div>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                      <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        onClick={() => handleRemoveObjective(objective.id)}
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ghl_link">
                <Card>
                  <CardHeader>
                    <CardTitle>Liaison avec un Compte GoHighLevel</CardTitle>
                    <CardDescription>
                      Liez ce chatbot à un compte GHL spécifique pour récupérer les données des champs personnalisés
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {(!goHighLevelConfig && ghlSubAccounts.length === 0) ? (
                      <div className="flex items-center p-4 rounded-md bg-yellow-50 border border-yellow-200">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                        <p className="text-sm text-yellow-800">
                          Vous devez d'abord configurer GoHighLevel dans la page Intégrations pour pouvoir lier un compte.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="ghlAccount">Compte GoHighLevel</Label>
                          <Select 
                            value={selectedGhlAccountId || 'none'} 
                            onValueChange={handleLinkGhlAccount}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un compte" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Aucun compte (délier)</SelectItem>
                              {allGhlAccounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {linkedAccount && (
                          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                            <div className="flex items-start gap-2">
                              <Building className="h-5 w-5 text-green-600 mt-0.5" />
                              <div>
                                <h3 className="font-medium">Compte lié: {linkedAccount.name}</h3>
                                <p className="text-sm text-green-700">
                                  {linkedAccount.locationId 
                                    ? `Location ID: ${linkedAccount.locationId}` 
                                    : linkedAccount.companyId 
                                      ? `Company ID: ${linkedAccount.companyId}` 
                                      : 'Aucun ID de location ou d\'entreprise trouvé'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="text-sm text-muted-foreground">
                          <p>La liaison avec un compte GHL permet de:</p>
                          <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
                            <li>Récupérer les champs personnalisés du compte spécifique</li>
                            <li>Envoyer les données collectées au bon compte</li>
                            <li>Gérer plusieurs chatbots pour différents clients</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="webhook">
                <Card>
                  <CardHeader>
                    <CardTitle>GoHighLevel Webhook Configuration</CardTitle>
                    <CardDescription>
                      Configure the webhook to connect this chatbot with GoHighLevel
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center p-4 rounded-md bg-yellow-50 border border-yellow-200">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                      <p className="text-sm text-yellow-800">
                        To complete setup, you'll need to configure the webhook in your GoHighLevel account.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="webhookUrl">Your Webhook URL</Label>
                      <div className="flex">
                        <Input
                          id="webhookUrl"
                          value={`https://example.com/api/webhook/${chatbot.id}`}
                          readOnly
                        />
                        <Button variant="outline" className="ml-2" onClick={() => {
                          navigator.clipboard.writeText(`https://example.com/api/webhook/${chatbot.id}`);
                          alert('Webhook URL copied to clipboard!');
                        }}>
                          Copy
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Copy this URL into your GoHighLevel webhook configuration.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ghlApiKey">GoHighLevel API Key</Label>
                      <Input
                        id="ghlApiKey"
                        type="password"
                        placeholder="Enter your GoHighLevel API key"
                      />
                      <p className="text-sm text-muted-foreground">
                        Your API key is used to send data back to GoHighLevel.
                      </p>
                    </div>
                    
                    <div className="space-y-2 pt-4">
                      <Label className="text-lg font-medium">Field Mapping</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Map your chatbot objectives to custom fields in GoHighLevel
                      </p>
                      
                      {chatbot.objectives.length === 0 ? (
                        <div className="text-center p-8 border border-dashed rounded-md">
                          <p className="text-muted-foreground">Define objectives first to map them to GHL fields</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {chatbot.objectives.map((objective) => (
                            <div key={objective.id} className="flex items-center gap-2">
                              <div className="w-1/3">
                                <Label>{objective.name}</Label>
                                <p className="text-xs text-muted-foreground">{objective.fieldToExtract}</p>
                              </div>
                              <div className="w-2/3 flex-1">
                                <Select defaultValue="">
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select GHL field" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="phone">Phone</SelectItem>
                                    <SelectItem value="firstName">First Name</SelectItem>
                                    <SelectItem value="lastName">Last Name</SelectItem>
                                    <SelectItem value="custom.interest">Custom: Interest</SelectItem>
                                    <SelectItem value="custom.source">Custom: Source</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ghl">
                <GhlFieldMappings chatbotId={id || ''} />
              </TabsContent>

              <div className="mt-6">
                <Button type="submit" className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Save Chatbot Configuration
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ChatbotConfig;
