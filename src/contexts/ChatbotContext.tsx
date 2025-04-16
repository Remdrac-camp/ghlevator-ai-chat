
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ChatbotConfig, Objective, GoHighLevelConfig } from '../types';

interface ChatbotContextType {
  chatbots: ChatbotConfig[];
  selectedChatbot: ChatbotConfig | null;
  goHighLevelConfig: GoHighLevelConfig | null;
  createChatbot: (chatbot: Omit<ChatbotConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  updateChatbot: (id: string, updates: Partial<ChatbotConfig>) => void;
  deleteChatbot: (id: string) => void;
  selectChatbot: (id: string) => void;
  addObjective: (chatbotId: string, objective: Omit<Objective, 'id'>) => void;
  updateObjective: (chatbotId: string, objectiveId: string, updates: Partial<Objective>) => void;
  removeObjective: (chatbotId: string, objectiveId: string) => void;
  updateGoHighLevelConfig: (config: GoHighLevelConfig) => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const ChatbotProvider = ({ children }: { children: ReactNode }) => {
  const [chatbots, setChatbots] = useState<ChatbotConfig[]>([]);
  const [selectedChatbot, setSelectedChatbot] = useState<ChatbotConfig | null>(null);
  const [goHighLevelConfig, setGoHighLevelConfig] = useState<GoHighLevelConfig | null>(null);

  // Load chatbots from localStorage on init
  React.useEffect(() => {
    const savedChatbots = localStorage.getItem('chatbots');
    const savedGHLConfig = localStorage.getItem('ghlConfig');

    if (savedChatbots) {
      setChatbots(JSON.parse(savedChatbots));
    }

    if (savedGHLConfig) {
      setGoHighLevelConfig(JSON.parse(savedGHLConfig));
    }
  }, []);

  // Save chatbots to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('chatbots', JSON.stringify(chatbots));
  }, [chatbots]);

  // Save GHL config to localStorage whenever it changes
  React.useEffect(() => {
    if (goHighLevelConfig) {
      localStorage.setItem('ghlConfig', JSON.stringify(goHighLevelConfig));
    }
  }, [goHighLevelConfig]);

  const createChatbot = (chatbot: Omit<ChatbotConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const newChatbot: ChatbotConfig = {
      ...chatbot,
      id: `chatbot-${Date.now()}`,
      userId: 'current-user', // In a real app, this would be the actual user ID
      objectives: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setChatbots([...chatbots, newChatbot]);
    setSelectedChatbot(newChatbot);
  };

  const updateChatbot = (id: string, updates: Partial<ChatbotConfig>) => {
    const updatedChatbots = chatbots.map(chatbot => 
      chatbot.id === id 
        ? { ...chatbot, ...updates, updatedAt: new Date() } 
        : chatbot
    );

    setChatbots(updatedChatbots);
    
    if (selectedChatbot && selectedChatbot.id === id) {
      setSelectedChatbot({ ...selectedChatbot, ...updates, updatedAt: new Date() });
    }
  };

  const deleteChatbot = (id: string) => {
    const filteredChatbots = chatbots.filter(chatbot => chatbot.id !== id);
    setChatbots(filteredChatbots);

    if (selectedChatbot && selectedChatbot.id === id) {
      setSelectedChatbot(null);
    }
  };

  const selectChatbot = (id: string) => {
    const chatbot = chatbots.find(c => c.id === id) || null;
    setSelectedChatbot(chatbot);
  };

  const addObjective = (chatbotId: string, objective: Omit<Objective, 'id'>) => {
    const newObjective: Objective = {
      ...objective,
      id: `objective-${Date.now()}`
    };

    updateChatbot(chatbotId, {
      objectives: [...(chatbots.find(c => c.id === chatbotId)?.objectives || []), newObjective]
    });
  };

  const updateObjective = (chatbotId: string, objectiveId: string, updates: Partial<Objective>) => {
    const chatbot = chatbots.find(c => c.id === chatbotId);
    
    if (!chatbot) return;

    const updatedObjectives = chatbot.objectives.map(obj => 
      obj.id === objectiveId ? { ...obj, ...updates } : obj
    );

    updateChatbot(chatbotId, { objectives: updatedObjectives });
  };

  const removeObjective = (chatbotId: string, objectiveId: string) => {
    const chatbot = chatbots.find(c => c.id === chatbotId);
    
    if (!chatbot) return;

    const filteredObjectives = chatbot.objectives.filter(obj => obj.id !== objectiveId);
    updateChatbot(chatbotId, { objectives: filteredObjectives });
  };

  const updateGoHighLevelConfig = (config: GoHighLevelConfig) => {
    setGoHighLevelConfig(config);
  };

  const value = {
    chatbots,
    selectedChatbot,
    goHighLevelConfig,
    createChatbot,
    updateChatbot,
    deleteChatbot,
    selectChatbot,
    addObjective,
    updateObjective,
    removeObjective,
    updateGoHighLevelConfig
  };

  return <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>;
};

export const useChatbot = (): ChatbotContextType => {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};
