
import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useChatbot } from '@/contexts/ChatbotContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Webhook } from 'lucide-react';
import ChatbotPreview from '@/components/ChatbotPreview';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const ChatbotTester = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { chatbots } = useChatbot();
  
  const chatbot = chatbots.find(c => c.id === id);
  
  useEffect(() => {
    if (!chatbot) {
      navigate('/dashboard');
    }
  }, [chatbot, navigate]);

  if (!chatbot) {
    return (
      <Layout requiresAuth>
        <div className="flex justify-center items-center h-64">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout requiresAuth>
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/chatbots/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{chatbot.name} - Test Mode</h1>
            <p className="text-muted-foreground">
              Test your chatbot and see how it interacts with users
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <ChatbotPreview chatbot={chatbot} />
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Simulated Data Collection</CardTitle>
                <CardDescription>
                  This is what would be sent to GoHighLevel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground">Objectives Status:</h3>
                  <div className="space-y-2">
                    {chatbot.objectives.length === 0 ? (
                      <p className="text-muted-foreground">No objectives configured</p>
                    ) : (
                      chatbot.objectives.map(objective => (
                        <div key={objective.id} className="flex items-center justify-between border-b pb-2">
                          <div>
                            <p className="font-medium">{objective.name}</p>
                            <p className="text-sm text-muted-foreground">Field: {objective.fieldToExtract}</p>
                          </div>
                          <div className="flex items-center">
                            <span className={`h-3 w-3 rounded-full ${objective.completed ? 'bg-green-500' : 'bg-orange-400'} mr-2`}></span>
                            <span className="text-sm">{objective.completed ? 'Completed' : 'Pending'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">Webhook Payload:</h3>
                  <div className="bg-slate-900 text-slate-50 p-4 rounded-md">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify({
                        conversation_id: "sim-123456",
                        customer_data: {
                          email: "pending...",
                          name: "pending...",
                          phone: "pending..."
                        },
                        objectives_completed: 0,
                        objectives_total: chatbot.objectives.length,
                        timestamp: new Date().toISOString()
                      }, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>GoHighLevel Integration</CardTitle>
                  <CardDescription>
                    Webhook status and configuration
                  </CardDescription>
                </div>
                <Webhook className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="font-medium">Webhook URL</span>
                  <span className="text-sm truncate max-w-[250px]">https://example.com/api/webhook/{id}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="font-medium">API Authentication</span>
                  <span className="text-sm text-yellow-600">Configured</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="font-medium">Last Webhook Test</span>
                  <span className="text-sm text-muted-foreground">Never</span>
                </div>
                
                <Button variant="outline" className="mt-4 w-full">
                  Test Webhook Connection
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ChatbotTester;
