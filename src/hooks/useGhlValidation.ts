import { useState, useCallback } from 'react';
import { GhlFieldMapping } from '@/types/ghl';
import { useToast } from '@/hooks/use-toast';

export const useGhlValidation = () => {
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);

  const validateFieldKey = useCallback((key: string): boolean => {
    if (!key) {
      toast({
        title: 'Erreur de validation',
        description: 'La clé GHL ne peut pas être vide',
        variant: 'destructive',
      });
      return false;
    }

    if (key.length > 100) {
      toast({
        title: 'Erreur de validation',
        description: 'La clé GHL ne peut pas dépasser 100 caractères',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  }, [toast]);

  const validateMapping = useCallback((mapping: Partial<GhlFieldMapping>): boolean => {
    if (!mapping.field_type) {
      toast({
        title: 'Erreur de validation',
        description: 'Le type de champ est requis',
        variant: 'destructive',
      });
      return false;
    }

    if (!mapping.ghl_field_key) {
      toast({
        title: 'Erreur de validation',
        description: 'La clé GHL est requise',
        variant: 'destructive',
      });
      return false;
    }

    if (!mapping.chatbot_parameter) {
      toast({
        title: 'Erreur de validation',
        description: 'Le paramètre du chatbot est requis',
        variant: 'destructive',
      });
      return false;
    }

    return validateFieldKey(mapping.ghl_field_key);
  }, [toast, validateFieldKey]);

  return {
    isValidating,
    validateFieldKey,
    validateMapping,
  };
}; 