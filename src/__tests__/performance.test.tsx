import React from 'react';
import { render, screen } from '@testing-library/react';
import { GhlFieldMappings } from '../components/ghl/GhlFieldMappings';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('Tests de performance', () => {
  const queryClient = new QueryClient();

  const renderWithPerformance = async (component: React.ReactElement) => {
    const startTime = performance.now();
    render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
    const endTime = performance.now();
    return endTime - startTime;
  };

  it('devrait charger la page des mappings en moins de 500ms', async () => {
    const loadTime = await renderWithPerformance(
      <GhlFieldMappings chatbotId="test-chatbot" />
    );
    expect(loadTime).toBeLessThan(500);
  });

  it('devrait mettre à jour la liste des mappings en moins de 200ms', async () => {
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <GhlFieldMappings chatbotId="test-chatbot" />
      </QueryClientProvider>
    );

    const startTime = performance.now();
    rerender(
      <QueryClientProvider client={queryClient}>
        <GhlFieldMappings chatbotId="test-chatbot" />
      </QueryClientProvider>
    );
    const endTime = performance.now();
    const updateTime = endTime - startTime;

    expect(updateTime).toBeLessThan(200);
  });

  it('devrait gérer 100 mappings sans impact significatif sur les performances', async () => {
    const mockMappings = Array(100).fill(null).map((_, index) => ({
      id: `mapping-${index}`,
      chatbot_id: 'test-chatbot',
      field_type: 'custom_value',
      ghl_field_key: `test.key.${index}`,
      chatbot_parameter: 'openai_key',
    }));

    // Mock de la requête Supabase
    jest.spyOn(require('@/integrations/supabase/client'), 'supabase').mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            data: mockMappings,
            error: null,
          }),
        }),
      }),
    });

    const loadTime = await renderWithPerformance(
      <GhlFieldMappings chatbotId="test-chatbot" />
    );

    expect(loadTime).toBeLessThan(1000);
  });
}); 