import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GhlFieldMappings } from '../GhlFieldMappings';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  },
}));

describe('GhlFieldMappings Integration', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <GhlFieldMappings chatbotId="test-chatbot" />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('should load and display mappings', async () => {
    const mockMappings = [
      {
        id: '1',
        chatbot_id: 'test-chatbot',
        field_type: 'custom_value',
        ghl_field_key: 'test-key',
        chatbot_parameter: 'openai_key',
      },
    ];

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: mockMappings, error: null }),
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('test-key')).toBeInTheDocument();
    });
  });

  it('should handle adding a new mapping', async () => {
    const newMapping = {
      id: '2',
      chatbot_id: 'test-chatbot',
      field_type: 'custom_value',
      ghl_field_key: 'new-key',
      chatbot_parameter: 'openai_key',
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
      insert: jest.fn().mockResolvedValue({ data: [newMapping], error: null }),
    });

    renderComponent();

    const addButton = screen.getByRole('button', { name: /ajouter/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('new-key')).toBeInTheDocument();
    });
  });

  it('should handle errors gracefully', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: null, error: new Error('Test error') }),
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/erreur/i)).toBeInTheDocument();
    });
  });
}); 