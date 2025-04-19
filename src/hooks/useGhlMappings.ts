import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GhlFieldMapping } from '@/types/ghl';
import { useToast } from '@/hooks/use-toast';

export const useGhlMappings = (chatbotId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: mappings, isLoading } = useQuery({
    queryKey: ['ghlMappings', chatbotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ghl_field_mappings')
        .select('*')
        .eq('chatbot_id', chatbotId);

      if (error) throw error;
      return data as GhlFieldMapping[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newMapping: Omit<GhlFieldMapping, 'id'>) => {
      const { data, error } = await supabase
        .from('ghl_field_mappings')
        .insert([newMapping])
        .select()
        .single();

      if (error) throw error;
      return data as GhlFieldMapping;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ghlMappings', chatbotId] });
      toast({
        title: 'Success',
        description: 'Mapping created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create mapping',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedMapping: GhlFieldMapping) => {
      const { data, error } = await supabase
        .from('ghl_field_mappings')
        .update(updatedMapping)
        .eq('id', updatedMapping.id)
        .select()
        .single();

      if (error) throw error;
      return data as GhlFieldMapping;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ghlMappings', chatbotId] });
      toast({
        title: 'Success',
        description: 'Mapping updated successfully',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ghl_field_mappings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ghlMappings', chatbotId] });
      toast({
        title: 'Success',
        description: 'Mapping deleted successfully',
      });
    },
  });

  return {
    mappings,
    isLoading,
    createMapping: createMutation.mutate,
    updateMapping: updateMutation.mutate,
    deleteMapping: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}; 