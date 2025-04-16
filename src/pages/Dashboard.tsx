
import React from 'react';
import Layout from '@/components/layout/Layout';
import { useChatbot } from '@/contexts/ChatbotContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Bot,
  Plus,
  MessageSquare, 
  Settings,
  Trash2, 
  Users, 
  Edit
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const Dashboard = () => {
  const { chatbots, createChatbot, selectChatbot, deleteChatbot } = useChatbot();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [newChatbotName, setNewChatbotName] = React.useState('');
  const [newChatbotDescription, setNewChatbotDescription] = React.useState('');
  const [welcomeMessage, setWelcomeMessage] = React.useState('Hello! How can I help you today?');

  const handleCreateChatbot = () => {
    if (!newChatbotName) return;
    
    createChatbot({
      name: newChatbotName,
      description: newChatbotDescription,
      welcomeMessage: welcomeMessage,
      systemPrompt: 'You are a helpful assistant.',
      openaiParams: {
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 500,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0
      },
      objectives: []
    });
    
    setOpen(false);
    setNewChatbotName('');
    setNewChatbotDescription('');
    setWelcomeMessage('Hello! How can I help you today?');
  };

  const handleEditChatbot = (id: string) => {
    selectChatbot(id);
    navigate(`/chatbots/${id}`);
  };

  const handleDeleteChatbot = (id: string) => {
    if (window.confirm('Are you sure you want to delete this chatbot?')) {
      deleteChatbot(id);
    }
  };

  return (
    <Layout requiresAuth>
      <div className="container mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Manage your chatbots and integrations</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Chatbot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Chatbot</DialogTitle>
                <DialogDescription>
                  Set up a new chatbot to integrate with GoHighLevel
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Customer Support Bot"
                    value={newChatbotName}
                    onChange={(e) => setNewChatbotName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="A bot that helps customers with their inquiries"
                    value={newChatbotDescription}
                    onChange={(e) => setNewChatbotDescription(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="welcome">Welcome Message</Label>
                  <Textarea
                    id="welcome"
                    placeholder="Hello! How can I help you today?"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateChatbot}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Chatbots
              </CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chatbots.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Conversations
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Users Engaged
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-semibold mt-8 mb-4">Your Chatbots</h2>
        
        {chatbots.length === 0 ? (
          <Card className="border-dashed border-2 bg-muted/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bot className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No chatbots yet</h3>
              <p className="text-muted-foreground text-center mb-4 max-w-md">
                Create your first chatbot to start engaging with your customers through GoHighLevel
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Chatbot
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Chatbot</DialogTitle>
                    <DialogDescription>
                      Set up a new chatbot to integrate with GoHighLevel
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name-new">Name</Label>
                      <Input
                        id="name-new"
                        placeholder="Customer Support Bot"
                        value={newChatbotName}
                        onChange={(e) => setNewChatbotName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description-new">Description</Label>
                      <Textarea
                        id="description-new"
                        placeholder="A bot that helps customers with their inquiries"
                        value={newChatbotDescription}
                        onChange={(e) => setNewChatbotDescription(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="welcome-new">Welcome Message</Label>
                      <Textarea
                        id="welcome-new"
                        placeholder="Hello! How can I help you today?"
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateChatbot}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chatbots.map((chatbot) => (
              <Card key={chatbot.id}>
                <CardHeader>
                  <CardTitle>{chatbot.name}</CardTitle>
                  <CardDescription>{chatbot.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    <span>0 conversations</span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Welcome message:</span> {chatbot.welcomeMessage}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Objectives:</span> {chatbot.objectives.length}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditChatbot(chatbot.id)}>
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/chatbots/${chatbot.id}/test`)}>
                      Test
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteChatbot(chatbot.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
