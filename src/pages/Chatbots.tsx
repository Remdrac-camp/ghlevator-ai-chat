import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useChatbot } from '@/contexts/ChatbotContext';
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
import { Bot, Plus, Edit, Trash2, MessageSquare } from 'lucide-react';

const Chatbots = () => {
  const { chatbots, createChatbot, deleteChatbot } = useChatbot();
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newChatbot, setNewChatbot] = useState({
    name: '',
    description: '',
    welcomeMessage: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
    systemPrompt: 'Vous êtes un assistant amical et serviable.',
  });

  const handleCreateChatbot = () => {
    if (!newChatbot.name) return;
    
    createChatbot({
      name: newChatbot.name,
      description: newChatbot.description,
      welcomeMessage: newChatbot.welcomeMessage,
      systemPrompt: newChatbot.systemPrompt,
      openaiParams: {
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 500,
        topP: 0.9,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0
      }
    });
    
    setNewChatbot({
      name: '',
      description: '',
      welcomeMessage: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
      systemPrompt: 'Vous êtes un assistant amical et serviable.',
    });
    
    setIsCreateDialogOpen(false);
  };

  const handleDeleteChatbot = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce chatbot ?')) {
      deleteChatbot(id);
    }
  };

  return (
    <Layout requiresAuth>
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Mes Chatbots</h1>
            <p className="text-muted-foreground">
              Créez et gérez vos chatbots d'acquisition de prospects
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <Plus className="mr-2 h-4 w-4" /> Nouveau Chatbot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau chatbot</DialogTitle>
                <DialogDescription>
                  Remplissez les informations pour créer votre nouveau chatbot.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    placeholder="Assistant Commercial"
                    value={newChatbot.name}
                    onChange={(e) => setNewChatbot({ ...newChatbot, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez le but de ce chatbot"
                    value={newChatbot.description}
                    onChange={(e) => setNewChatbot({ ...newChatbot, description: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="welcomeMessage">Message d'accueil</Label>
                  <Input
                    id="welcomeMessage"
                    placeholder="Bonjour ! Comment puis-je vous aider aujourd'hui ?"
                    value={newChatbot.welcomeMessage}
                    onChange={(e) => setNewChatbot({ ...newChatbot, welcomeMessage: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleCreateChatbot}>Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chatbots.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center p-12 border border-dashed rounded-lg">
              <Bot className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun chatbot pour le moment</h3>
              <p className="text-muted-foreground text-center mb-4">
                Créez votre premier chatbot pour commencer à collecter des prospects
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nouveau Chatbot
              </Button>
            </div>
          ) : (
            chatbots.map((chatbot) => (
              <Card key={chatbot.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle>{chatbot.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {chatbot.description || "Aucune description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    <span>
                      {chatbot.objectives.length} objectif{chatbot.objectives.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Modèle: {chatbot.openaiParams.model}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t bg-muted/50 p-2">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/chatbots/${chatbot.id}`)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteChatbot(chatbot.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/chatbots/${chatbot.id}/test`)}>
                    Tester
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Chatbots;
