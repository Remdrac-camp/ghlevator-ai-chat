import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GhlFieldMappings } from '../components/ghl/GhlFieldMappings';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

describe('Tests des cas limites et scénarios d\'erreur', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('devrait gérer les erreurs de réseau', async () => {
    // Mock d'une erreur de réseau
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error('Network error')),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <GhlFieldMappings chatbotId="test-chatbot" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/erreur de réseau/i)).toBeInTheDocument();
    });
  });

  it('devrait gérer les données invalides de l\'API', async () => {
    // Mock de données invalides
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: [{ invalid: 'data' }],
        error: null,
      }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <GhlFieldMappings chatbotId="test-chatbot" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/données invalides/i)).toBeInTheDocument();
    });
  });

  it('devrait gérer les limites de caractères', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <GhlFieldMappings chatbotId="test-chatbot" />
      </QueryClientProvider>
    );

    const input = screen.getByTestId('ghl-field-input');
    fireEvent.change(input, { target: { value: 'a'.repeat(101) } });

    await waitFor(() => {
      expect(screen.getByText(/100 caractères/i)).toBeInTheDocument();
    });
  });

  it('devrait gérer les conflits de données', async () => {
    // Mock d'un conflit lors de la sauvegarde
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
      insert: jest.fn().mockRejectedValue({
        code: '23505', // Code d'erreur PostgreSQL pour violation de contrainte unique
        message: 'Duplicate key value violates unique constraint',
      }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <GhlFieldMappings chatbotId="test-chatbot" />
      </QueryClientProvider>
    );

    const addButton = screen.getByTestId('add-mapping-button');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/clé déjà existante/i)).toBeInTheDocument();
    });
  });

  it('devrait gérer les timeouts', async () => {
    // Mock d'un timeout
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockImplementation(() => new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 10000);
      })),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <GhlFieldMappings chatbotId="test-chatbot" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/timeout/i)).toBeInTheDocument();
    });
  });
}); 