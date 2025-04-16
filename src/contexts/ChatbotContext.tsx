import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ChatbotConfig, Objective, GoHighLevelConfig, GhlAccount } from '../types';

interface ChatbotContextType {
  chatbots: ChatbotConfig[];
  selectedChatbot: ChatbotConfig | null;
  goHighLevelConfig: GoHighLevelConfig | null;
  ghlSubAccounts: GhlAccount[];
  createChatbot: (chatbot: Omit<ChatbotConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  updateChatbot: (id: string, updates: Partial<ChatbotConfig>) => void;
  deleteChatbot: (id: string) => void;
  selectChatbot: (id: string) => void;
  addObjective: (chatbotId: string, objective: Omit<Objective, 'id'>) => void;
  updateObjective: (chatbotId: string, objectiveId: string, updates: Partial<Objective>) => void;
  removeObjective: (chatbotId: string, objectiveId: string) => void;
  updateGoHighLevelConfig: (config: GoHighLevelConfig) => void;
  linkChatbotToGhlAccount: (chatbotId: string, accountId: string | null) => void;
  getLinkedGhlAccount: (chatbotId: string) => GhlAccount | null;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const ChatbotProvider = ({ children }: { children: ReactNode }) => {
  const [chatbots, setChatbots] = useState<ChatbotConfig[]>([]);
  const [selectedChatbot, setSelectedChatbot] = useState<ChatbotConfig | null>(null);
  const [goHighLevelConfig, setGoHighLevelConfig] = useState<GoHighLevelConfig | null>(null);
  const [ghlSubAccounts, setGhlSubAccounts] = useState<GhlAccount[]>([]);
  const [chatbotGhlLinks, setChatbotGhlLinks] = useState<Record<string, string>>({});

  // Load chatbots from localStorage on init
  React.useEffect(() => {
    const savedChatbots = localStorage.getItem('chatbots');
    const savedGHLConfig = localStorage.getItem('ghlConfig');
    const savedSubAccounts = localStorage.getItem('ghlSubAccounts');
    const savedChatbotGhlLinks = localStorage.getItem('chatbotGhlLinks');
    
    // Migrate old GHL API key if it exists
    const oldGhlApiKey = localStorage.getItem('ghlApiKey');
    const oldGhlLocationId = localStorage.getItem('ghlLocationId');
    const oldGhlCompanyId = localStorage.getItem('ghlCompanyId');
    
    if (savedChatbots) {
      setChatbots(JSON.parse(savedChatbots));
    }

    if (savedGHLConfig) {
      setGoHighLevelConfig(JSON.parse(savedGHLConfig));
    } else if (oldGhlApiKey) {
      // Create a new config from old values for backward compatibility
      const newConfig: GoHighLevelConfig = {
        apiKey: oldGhlApiKey,
        isAgency: localStorage.getItem('ghlIsAgencyAccount') === 'true',
        mappedFields: []
      };
      
      if (oldGhlLocationId) {
        newConfig.locationId = oldGhlLocationId;
      }
      
      if (oldGhlCompanyId) {
        newConfig.companyId = oldGhlCompanyId;
      }
      
      setGoHighLevelConfig(newConfig);
      localStorage.setItem('ghlConfig', JSON.stringify(newConfig));
      
      console.log('Migrated old GHL config to new structure', newConfig);
    }

    if (savedSubAccounts) {
      setGhlSubAccounts(JSON.parse(savedSubAccounts));
    }

    if (savedChatbotGhlLinks) {
      setChatbotGhlLinks(JSON.parse(savedChatbotGhlLinks));
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
      
      // Keep backwards compatibility with old code that reads from these keys
      localStorage.setItem('ghlApiKey', goHighLevelConfig.apiKey);
      
      if (goHighLevelConfig.locationId) {
        localStorage.setItem('ghlLocationId', goHighLevelConfig.locationId);
      }
      
      if (goHighLevelConfig.companyId) {
        localStorage.setItem('ghlCompanyId', goHighLevelConfig.companyId);
      }
      
      localStorage.setItem('ghlIsAgencyAccount', goHighLevelConfig.isAgency ? 'true' : 'false');
    }
  }, [goHighLevelConfig]);

  // Save chatbot-GHL links to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('chatbotGhlLinks', JSON.stringify(chatbotGhlLinks));
  }, [chatbotGhlLinks]);

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

    // Remove any GHL account link for this chatbot
    if (chatbotGhlLinks[id]) {
      const updatedLinks = { ...chatbotGhlLinks };
      delete updatedLinks[id];
      setChatbotGhlLinks(updatedLinks);
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

  const linkChatbotToGhlAccount = (chatbotId: string, accountId: string | null) => {
    if (accountId) {
      setChatbotGhlLinks(prev => ({
        ...prev,
        [chatbotId]: accountId
      }));
    } else {
      // If accountId is null, remove the link
      const updatedLinks = { ...chatbotGhlLinks };
      delete updatedLinks[chatbotId];
      setChatbotGhlLinks(updatedLinks);
    }
  };

  const getLinkedGhlAccount = (chatbotId: string): GhlAccount | null => {
    const accountId = chatbotGhlLinks[chatbotId];
    if (!accountId) return null;
    
    // Check if it's the main account
    if (accountId === 'main' && goHighLevelConfig) {
      return {
        id: 'main',
        name: 'Compte Principal',
        apiKey: goHighLevelConfig.apiKey,
        locationId: goHighLevelConfig.locationId,
        companyId: goHighLevelConfig.companyId,
        active: true
      };
    }

    // Or if it's a sub-account
    return ghlSubAccounts.find(account => account.id === accountId) || null;
  };

  const value = {
    chatbots,
    selectedChatbot,
    goHighLevelConfig,
    ghlSubAccounts,
    createChatbot,
    updateChatbot,
    deleteChatbot,
    selectChatbot,
    addObjective,
    updateObjective,
    removeObjective,
    updateGoHighLevelConfig,
    linkChatbotToGhlAccount,
    getLinkedGhlAccount
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
