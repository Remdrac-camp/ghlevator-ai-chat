
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatbotConfig, Message } from '@/types';
import { Send } from 'lucide-react';

interface ChatbotPreviewProps {
  chatbot: ChatbotConfig;
}

const ChatbotPreview: React.FC<ChatbotPreviewProps> = ({ chatbot }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: chatbot.welcomeMessage,
      timestamp: new Date()
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);

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

    // Simulate API delay
    setTimeout(() => {
      // Process objectives (simple simulation)
      let responseContent = '';
      let nextObjective = null;

      // Find the first incomplete objective
      for (const objective of chatbot.objectives) {
        if (!objective.completed) {
          nextObjective = objective;
          break;
        }
      }

      if (nextObjective) {
        // Simulate AI trying to collect specific information
        if (nextObjective.fieldToExtract === 'email' && userMessage.content.includes('@')) {
          responseContent = `Thank you for providing your email. What's your name?`;
        } else if (nextObjective.fieldToExtract === 'name' && userMessage.content.length > 2) {
          responseContent = `Nice to meet you, ${userMessage.content}! How can I help you today?`;
        } else if (nextObjective.fieldToExtract === 'phone' && /\d/.test(userMessage.content)) {
          responseContent = `Got your contact number. What services are you interested in?`;
        } else {
          // Default response if objective not met
          if (nextObjective.fieldToExtract === 'email') {
            responseContent = "To help you better, could you please share your email address?";
          } else if (nextObjective.fieldToExtract === 'phone') {
            responseContent = "What's a good phone number where we can reach you?";
          } else if (nextObjective.fieldToExtract === 'name') {
            responseContent = "What's your name?";
          } else {
            responseContent = "Thanks for your message. Can you please provide more information?";
          }
        }
      } else {
        // Generic responses when no objectives are pending
        const genericResponses = [
          "That's interesting! Tell me more about what you're looking for.",
          "I appreciate your patience. How else can I assist you today?",
          "I'll make a note of that. Is there anything specific you need help with?",
          "Thank you for sharing that information. What other questions do you have?"
        ];
        
        responseContent = genericResponses[Math.floor(Math.random() * genericResponses.length)];
      }

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setLoading(false);
    }, 1500);
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
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChatbotPreview;
