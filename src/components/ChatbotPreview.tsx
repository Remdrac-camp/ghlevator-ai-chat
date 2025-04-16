
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatbotConfig, Message } from '@/types';
import { Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface ChatbotPreviewProps {
  chatbot: ChatbotConfig;
}

const ChatbotPreview: React.FC<ChatbotPreviewProps> = ({ chatbot }) => {
  const { apiKeys } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);

  // Initialize the chat with the welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: chatbot.welcomeMessage,
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    setConversationHistory([
      { role: 'system', content: chatbot.systemPrompt },
      { role: 'assistant', content: chatbot.welcomeMessage }
    ]);
  }, [chatbot.welcomeMessage, chatbot.systemPrompt]);

  const callOpenAI = async (history: Array<{ role: string; content: string }>) => {
    if (!apiKeys.openai) {
      toast({
        title: "API Key Missing",
        description: "Please add your OpenAI API key in the API Keys section.",
        variant: "destructive"
      });
      return "I can't respond right now. Please make sure an OpenAI API key is configured in the API Keys section.";
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeys.openai}`
        },
        body: JSON.stringify({
          model: chatbot.openaiParams.model,
          messages: history,
          temperature: chatbot.openaiParams.temperature,
          max_tokens: chatbot.openaiParams.maxTokens,
          top_p: chatbot.openaiParams.topP,
          frequency_penalty: chatbot.openaiParams.frequencyPenalty,
          presence_penalty: chatbot.openaiParams.presencePenalty
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("OpenAI API error:", data);
        throw new Error(data.error?.message || 'Failed to get response');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error calling OpenAI:", error);
      toast({
        title: "API Error",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        variant: "destructive"
      });
      return "Sorry, I encountered an error. Please try again later.";
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setLoading(true);

    // Update conversation history
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: userInput }
    ];
    setConversationHistory(updatedHistory);

    try {
      // Get response from OpenAI
      const responseContent = await callOpenAI(updatedHistory);

      // Check if any objectives are met in the user's message
      let objectivesUpdated = false;
      const updatedObjectives = chatbot.objectives.map(objective => {
        if (objective.completed) return objective;

        // Simple check if the user message contains information related to the objective
        // In a real implementation, this would be more sophisticated
        let matched = false;
        if (objective.fieldToExtract === 'email' && userInput.includes('@')) {
          matched = true;
        } else if (objective.fieldToExtract === 'phone' && /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(userInput)) {
          matched = true;
        } else if (objective.fieldToExtract === 'name' && userInput.length > 2 && !/^[0-9\s]+$/.test(userInput)) {
          matched = true;
        }

        if (matched) {
          objectivesUpdated = true;
          return { ...objective, completed: true };
        }
        return objective;
      });

      if (objectivesUpdated) {
        // This is a simulation - in a real app you'd want to update the objectives in the chatbot context
        console.log("Objectives updated:", updatedObjectives);
      }

      // Add AI response to chat
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Update conversation history with AI response
      setConversationHistory([
        ...updatedHistory,
        { role: 'assistant', content: responseContent }
      ]);
    } catch (error) {
      console.error("Error in chat:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-2">
      <div className="bg-primary p-3 text-primary-foreground text-center rounded-t-md">
        <h3 className="font-medium">{chatbot.name} Preview</h3>
      </div>
      <ScrollArea className="h-96 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}
              >
                <p>{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <CardContent className="p-4 border-t">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }} 
          className="flex gap-2"
        >
          <Input
            placeholder="Type your message..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChatbotPreview;
