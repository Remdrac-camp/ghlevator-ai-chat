import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, TestTube, Info, Search, MessageCircle } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface GhlFieldMapping {
  id: string;
  chatbot_id: string;
  field_type: 'custom_value' | 'custom_field';
  ghl_field_key: string;
  chatbot_parameter: 'openai_key' | 'system_prompt' | 'welcome_message' | 'temperature' | 'max_tokens';
  location_id?: string;
  company_id?: string;
}

interface GhlFieldMappingsProps {
  chatbotId: string;
}

const CHATBOT_PARAMETERS = [
  { value: 'openai_key', label: 'OpenAI API Key' },
  { value: 'system_prompt', label: 'System Prompt' },
  { value: 'welcome_message', label: 'Welcome Message' },
  { value: 'temperature', label: 'Temperature' },
  { value: 'max_tokens', label: 'Max Tokens' },
];

// Fonction améliorée pour extraire l'ID de location ou company à partir du JWT
const extractGhlIds = (jwt: string): { locationId?: string; companyId?: string; isValid: boolean } => {
  try {
    // Diviser le JWT en parties
    const parts = jwt.split('.');
    if (parts.length !== 3) return { isValid: false };
    
    // Décoder la partie payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Vérifier la présence d'un company_id ou location_id
    const result = {
      locationId: payload.location_id || undefined,
      companyId: payload.company_id || undefined,
      isValid: !!(payload.location_id || payload.company_id)
    };
    
    console.log('Extracted JWT payload:', payload);
    console.log('Extracted IDs:', result);
    
    return result;
  } catch (error) {
    console.error('Erreur lors du décodage du JWT:', error);
    return { isValid: false };
  }
};

// Helper function to format GHL keys
const formatGhlKey = (key: string): string => {
  // If the key doesn't look like a custom_values format, convert it to one
  if (!key.includes('custom_values.') && !key.includes('{{')) {
    return `{{ custom_values.${key.toLowerCase().replace(/\s+/g, '_')} }}`;
  }
  return key;
};

export const GhlFieldMappings: React.FC<GhlFieldMappingsProps> = ({ chatbotId }) => {
  const { toast } = useToast();
  const [showDebugDialog, setShowDebugDialog] = React.useState(false);
  const [debugData, setDebugData] = React.useState<any>(null);
  const [showWelcomeMessagePreview, setShowWelcomeMessagePreview] = React.useState(false);
  const [newMapping, setNewMapping] = React.useState<{
    chatbot_id: string;
    field_type: 'custom_value' | 'custom_field';
    ghl_field_key: string;
    chatbot_parameter?: 'openai_key' | 'system_prompt' | 'welcome_message' | 'temperature' | 'max_tokens';
  }>({
    chatbot_id: chatbotId,
    field_type: 'custom_value',
    ghl_field_key: '',
  });

  const { data: mappings, refetch } = useQuery({
    queryKey: ['ghl-mappings', chatbotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ghl_field_mappings')
        .select('*')
        .eq('chatbot_id', chatbotId);

      if (error) throw error;
      return data as GhlFieldMapping[];
    },
  });

  const addMappingMutation = useMutation({
    mutationFn: async (mapping: {
      chatbot_id: string;
      field_type: string;
      ghl_field_key: string;
      chatbot_parameter: string;
    }) => {
      // Format the GHL key correctly
      const formattedMapping = {
        ...mapping,
        ghl_field_key: formatGhlKey(mapping.ghl_field_key)
      };
      
      const { data, error } = await supabase
        .from('ghl_field_mappings')
        .insert([formattedMapping])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Mapping ajouté",
        description: "Le mapping GHL a été ajouté avec succès.",
      });
      refetch();
      setNewMapping({ 
        chatbot_id: chatbotId, 
        field_type: 'custom_value',
        ghl_field_key: '' 
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de l'ajout du mapping: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteMappingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ghl_field_mappings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Mapping supprimé",
        description: "Le mapping GHL a été supprimé avec succès.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de la suppression du mapping: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const testGhlValueMutation = useMutation({
    mutationFn: async (ghlFieldKey: string) => {
      // Get the locationId from localStorage - this is set in Integrations.tsx
      let locationId = localStorage.getItem('ghlLocationId');
      // Récupérer également la clé API GHL
      const ghlApiKey = localStorage.getItem('ghlApiKey');
      
      console.log('LocationID from localStorage:', locationId);
      console.log('GHL API Key available:', !!ghlApiKey);
      
      // Si pas de locationId, essayer d'extraire du token JWT
      if (!locationId && ghlApiKey) {
        console.log('Tentative d\'extraction du locationId depuis le JWT...');
        const extracted = extractGhlIds(ghlApiKey);
        if (extracted.isValid && extracted.locationId) {
          locationId = extracted.locationId;
          // Stocker pour utilisation future
          localStorage.setItem('ghlLocationId', locationId);
          console.log('LocationID extrait du JWT et stocké:', locationId);
        } else if (extracted.isValid && extracted.companyId) {
          console.log('CompanyID trouvé, mais pas de LocationID. CompanyID:', extracted.companyId);
        }
      }
      
      if (!locationId) {
        toast({
          title: "Location ID manquant",
          description: "Aucun Location ID trouvé. Assurez-vous que le compte GHL est correctement configuré dans les Intégrations.",
          variant: "destructive",
        });
        throw new Error('Location ID not found in local storage or JWT');
      }
      
      if (!ghlApiKey) {
        toast({
          title: "API GHL manquante",
          description: "Aucune clé API GHL trouvée. Veuillez configurer l'intégration GHL d'abord.",
          variant: "destructive",
        });
        throw new Error('No GHL API key found in local storage');
      }
      
      // Find the specific mapping for this key
      const mapping = mappings?.find(m => m.ghl_field_key === ghlFieldKey);
      if (!mapping) {
        throw new Error('Mapping not found');
      }
      
      // Get the parameter label that we're testing
      const parameterInfo = CHATBOT_PARAMETERS.find(p => p.value === mapping.chatbot_parameter);
      const parameterLabel = parameterInfo?.label || mapping.chatbot_parameter;
      
      // Extract the field name from the custom_values format if possible
      let searchKey = ghlFieldKey;
      if (searchKey.includes('custom_values.')) {
        searchKey = searchKey.split('custom_values.')[1].replace('}}', '').trim();
      }
      // Or use the parameter name if we're searching for OpenAI Key
      if (mapping.chatbot_parameter === 'openai_key') {
        searchKey = 'OpenAI Key';
      } else if (mapping.chatbot_parameter === 'welcome_message') {
        // For welcome message, we'll try several different terms
        searchKey = 'welcome_message';
      }
      
      console.log(`Testing GHL field: ${searchKey} for parameter: ${parameterLabel}`);
      console.log(`Using locationId: ${locationId}`);

      // Call the test function
      const { data, error } = await supabase.functions.invoke('test-ghl-field', {
        body: {
          locationId: locationId,
          ghlApiKey: ghlApiKey,
          fieldKey: searchKey
        }
      });

      if (error) throw error;
      
      // Save full debug data
      setDebugData(data);

      // For welcome message testing, let's show a special dialog
      if (mapping.chatbot_parameter === 'welcome_message' && data.potentialWelcomeMatches?.length > 0) {
        setShowWelcomeMessagePreview(true);
      }
      
      return { 
        ...data, 
        mappingType: mapping.field_type,
        fieldKey: ghlFieldKey,
        parameterLabel: parameterLabel,
        searchKey: searchKey
      };
    },
    onSuccess: (data) => {
      // Show a more detailed toast message
      toast({
        title: data.found ? `Valeur trouvée pour "${data.parameterLabel}"` : `Valeur non trouvée pour "${data.parameterLabel}"`,
        description: data.found 
          ? `Valeur: ${data.value && data.value.length > 30 ? `${data.value.substring(0, 30)}...` : data.value} (${data.name || data.key})` 
          : `Recherche pour "${data.searchKey}" n'a pas trouvé de correspondance. Cliquez sur 'Afficher les détails' pour voir toutes les clés disponibles.`,
        variant: data.found ? "default" : "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => setShowDebugDialog(true)}>
            Afficher les détails
          </Button>
        )
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de Test",
        description: `Erreur lors de la récupération de la valeur: ${error.message}`,
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => setShowDebugDialog(true)}>
            Afficher les détails
          </Button>
        )
      });
    },
  });

  const handleAddMapping = () => {
    if (!newMapping.ghl_field_key || !newMapping.chatbot_parameter) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }
    
    const mappingToAdd = {
      chatbot_id: newMapping.chatbot_id,
      field_type: newMapping.field_type,
      ghl_field_key: newMapping.ghl_field_key,
      chatbot_parameter: newMapping.chatbot_parameter
    };
    
    addMappingMutation.mutate(mappingToAdd);
  };

  const handleTestMapping = (ghlFieldKey: string) => {
    testGhlValueMutation.mutate(ghlFieldKey);
  };

  const findWelcomeMessages = async () => {
    // Get the locationId from localStorage - this is set in Integrations.tsx
    let locationId = localStorage.getItem('ghlLocationId');
    console.log('LocationID from localStorage:', locationId);

    // Get GHL API key from localStorage
    const ghlApiKey = localStorage.getItem('ghlApiKey');
    console.log('GHL API Key available:', !!ghlApiKey);
    
    // Si pas de locationId, essayer d'extraire du token JWT
    if (!locationId && ghlApiKey) {
      console.log('Tentative d\'extraction du locationId depuis le JWT...');
      const extracted = extractGhlIds(ghlApiKey);
      if (extracted.isValid && extracted.locationId) {
        locationId = extracted.locationId;
        // Stocker pour utilisation future
        localStorage.setItem('ghlLocationId', locationId);
        console.log('LocationID extrait du JWT et stocké:', locationId);
      } else if (extracted.isValid && extracted.companyId) {
        console.log('CompanyID trouvé, mais pas de LocationID. CompanyID:', extracted.companyId);
      }
    }

    if (!locationId) {
      toast({
        title: "Location ID manquant",
        description: "Aucun Location ID trouvé. Assurez-vous que le compte GHL est correctement configuré dans les Intégrations.",
        variant: "destructive",
      });
      return;
    }
    
    if (!ghlApiKey) {
      toast({
        title: "API GHL manquante",
        description: "Aucune clé API GHL trouvée. Veuillez configurer l'intégration GHL d'abord.",
        variant: "destructive",
      });
      return;
    }
    
    // Call the test function with a special search key for welcome messages
    const { data, error } = await supabase.functions.invoke('test-ghl-field', {
      body: {
        locationId: locationId,
        ghlApiKey: ghlApiKey,
        fieldKey: "welcome_message"
      }
    });

    if (error) {
      toast({
        title: "Erreur",
        description: `Erreur lors de la recherche des messages d'accueil: ${error.message}`,
        variant: "destructive",
      });
      return;
    }
    
    setDebugData(data);
    setShowWelcomeMessagePreview(true);
    
    toast({
      title: "Recherche terminée",
      description: `${data.potentialWelcomeMatches?.length || 0} messages d'accueil potentiels trouvés.`,
      action: (
        <Button variant="outline" size="sm" onClick={() => setShowWelcomeMessagePreview(true)}>
          Voir les résultats
        </Button>
      )
    });
  };

  // Effet pour vérifier les données GHL au chargement
  useEffect(() => {
    const checkGhlConfiguration = () => {
      // Vérifier le locationId dans localStorage
      let locationId = localStorage.getItem('ghlLocationId');
      const ghlApiKey = localStorage.getItem('ghlApiKey');
      
      // Si le locationId n'est pas présent mais qu'on a une clé API
      if (!locationId && ghlApiKey) {
        console.log("Tentative d'extraire le locationId depuis le JWT au chargement...");
        const extracted = extractGhlIds(ghlApiKey);
        
        if (extracted.isValid && extracted.locationId) {
          locationId = extracted.locationId;
          localStorage.setItem('ghlLocationId', locationId);
          console.log("LocationID extrait et sauvegardé:", locationId);
        }
      }
      
      // Informer l'utilisateur de l'état de la configuration
      if (!locationId || !ghlApiKey) {
        toast({
          title: "Configuration GHL incomplète",
          description: !locationId 
            ? "Location ID non trouvé. Configurez l'intégration GHL dans la page Intégrations." 
            : "Clé API GHL non trouvée. Configurez l'intégration GHL dans la page Intégrations.",
          variant: "destructive",
        });
      }
    };
    
    checkGhlConfiguration();
  }, [toast]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Mappings GoHighLevel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 border-b pb-6">
            <div className="space-y-2">
              <Label>Type de champ GHL</Label>
              <Select
                value={newMapping.field_type}
                onValueChange={(value: 'custom_value' | 'custom_field') => 
                  setNewMapping({ ...newMapping, field_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom_value">Custom Value</SelectItem>
                  <SelectItem value="custom_field">Custom Field</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Clé GHL</Label>
              <div className="space-y-1">
                <Input 
                  placeholder="Ex: openai_key ou {{ custom_values.openai_key }}"
                  value={newMapping.ghl_field_key || ''}
                  onChange={(e) => setNewMapping({ ...newMapping, ghl_field_key: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Pour OpenAI API Key, utilisez simplement "OpenAI Key" ou "openai_key"
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Paramètre du chatbot</Label>
              <Select
                value={newMapping.chatbot_parameter}
                onValueChange={(value: GhlFieldMapping['chatbot_parameter']) => 
                  setNewMapping({ ...newMapping, chatbot_parameter: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le paramètre" />
                </SelectTrigger>
                <SelectContent>
                  {CHATBOT_PARAMETERS.map((param) => (
                    <SelectItem key={param.value} value={param.value}>
                      {param.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddMapping} disabled={addMappingMutation.isPending} className="flex-1">
                Ajouter le mapping
              </Button>
              <Button 
                variant="secondary" 
                onClick={findWelcomeMessages}
                disabled={testGhlValueMutation.isPending}
              >
                <Search className="h-4 w-4 mr-1" />
                Rechercher Welcome Messages
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Mappings existants</h3>
            {mappings?.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>Aucun mapping configuré</p>
                <p className="text-sm mt-1">Créez un nouveau mapping en utilisant le formulaire ci-dessus</p>
              </div>
            ) : (
              mappings?.map((mapping) => (
                <div key={mapping.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{mapping.ghl_field_key}</p>
                    <p className="text-sm text-muted-foreground">
                      {mapping.field_type} → {
                        CHATBOT_PARAMETERS.find(p => p.value === mapping.chatbot_parameter)?.label
                      }
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleTestMapping(mapping.ghl_field_key)}
                      disabled={testGhlValueMutation.isPending}
                    >
                      <TestTube className="h-4 w-4 mr-1" />
                      Tester
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteMappingMutation.mutate(mapping.id)}
                      disabled={deleteMappingMutation.isPending}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debug dialog */}
      <Dialog open={showDebugDialog} onOpenChange={setShowDebugDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Informations de débogage GHL
            </DialogTitle>
            <DialogDescription>
              Voici les détails techniques de la requête GoHighLevel
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {debugData && (
              <>
                <div>
                  <h3 className="font-medium mb-2">Résultat de la recherche</h3>
                  <div className="bg-muted p-3 rounded-md">
                    {debugData.found ? (
                      <div className="space-y-2">
                        <p><span className="font-semibold">Clé trouvée:</span> {debugData.key}</p>
                        <p><span className="font-semibold">Nom:</span> {debugData.name}</p>
                        <p><span className="font-semibold">Valeur:</span> {debugData.value}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-yellow-500">Aucune valeur correspondante trouvée</p>
                        <p><span className="font-semibold">Termes recherchés:</span></p>
                        <ul className="list-disc pl-5 text-xs space-y-1">
                          {debugData.searchTerms?.map((term: string, index: number) => (
                            <li key={index}>{term}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {debugData.potentialWelcomeMatches && debugData.potentialWelcomeMatches.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2 flex items-center">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      <span>Messages d'accueil potentiels</span>
                    </h3>
                    <div className="bg-muted p-3 rounded-md">
                      <Accordion type="single" collapsible className="w-full">
                        {debugData.potentialWelcomeMatches.map((item: any, index: number) => (
                          <AccordionItem key={index} value={`welcome-${index}`}>
                            <AccordionTrigger>
                              <div className="text-left">
                                <div className="font-medium">{item.name || item.key}</div>
                                <div className="text-xs text-muted-foreground">{item.key}</div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="p-3 bg-background rounded border">
                                {item.valuePreview}
                              </div>
                              <div className="flex justify-end mt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setNewMapping({
                                      ...newMapping,
                                      ghl_field_key: item.key,
                                      chatbot_parameter: 'welcome_message'
                                    });
                                    setShowDebugDialog(false);
                                  }}
                                >
                                  Utiliser cette valeur
                                </Button>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </div>
                )}

                {debugData.textContentFields && debugData.textContentFields.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2 flex items-center">
                      <span>Champs avec contenu textuel (candidats possibles pour message d'accueil)</span>
                    </h3>
                    <div className="bg-muted p-3 rounded-md max-h-60 overflow-y-auto">
                      <Accordion type="single" collapsible className="w-full">
                        {debugData.textContentFields.map((item: any, index: number) => (
                          <AccordionItem key={index} value={`text-${index}`}>
                            <AccordionTrigger>
                              <div className="text-left">
                                <div className="font-medium">{item.name || item.key}</div>
                                <div className="text-xs text-muted-foreground">{item.key}</div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="p-3 bg-background rounded border">
                                {item.valuePreview}
                              </div>
                              <div className="flex justify-end mt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setNewMapping({
                                      ...newMapping,
                                      ghl_field_key: item.key,
                                      chatbot_parameter: 'welcome_message'
                                    });
                                    setShowDebugDialog(false);
                                  }}
                                >
                                  Utiliser cette valeur
                                </Button>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <span>Toutes les clés disponibles dans GHL</span>
                    <div className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {debugData.allKeys?.length || 0} clés
                    </div>
                  </h3>
                  <div className="bg-muted p-3 rounded-md max-h-60 overflow-y-auto">
                    {debugData.allKeys?.length > 0 ? (
                      <ul className="space-y-2">
                        {debugData.allKeys.map((item: any, index: number) => (
                          <li key={index} className="border-b border-border pb-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-semibold">Clé:</span> {item.key}
                                {item.name && <span className="ml-2">(<span className="font-semibold">Nom:</span> {item.name})</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                {item.valuePreview && (
                                  <span className="text-xs text-gray-500">{item.valuePreview}</span>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setNewMapping({
                                      ...newMapping,
                                      ghl_field_key: item.key
                                    });
                                    setShowDebugDialog(false);
                                  }}
                                >
                                  Utiliser
                                </Button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-yellow-500">Aucune clé trouvée dans GoHighLevel</p>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {!debugData && (
              <div className="text-center py-4 text-muted-foreground">
                <p>Aucune donnée de débogage disponible</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDebugDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Welcome Message Preview Dialog */}
      <Dialog open={showWelcomeMessagePreview} onOpenChange={setShowWelcomeMessagePreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              Messages d'accueil disponibles
            </DialogTitle>
            <DialogDescription>
              Ces champs GHL pourraient contenir des messages d'accueil pour votre chatbot
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {debugData?.potentialWelcomeMatches && debugData.potentialWelcomeMatches.length > 0 ? (
              <div className="space-y-4">
                <Accordion type="single" collapsible className="w-full">
                  {debugData.potentialWelcomeMatches.map((item: any, index: number) => (
                    <AccordionItem key={index} value={`welcome-preview-${index}`}>
                      <AccordionTrigger>
                        <div className="text-left">
                          <div className="font-medium">{item.name || item.key}</div>
                          <div className="text-xs text-muted-foreground">{item.key}</div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="p-4 bg-muted rounded-md">
                          <p>{item.valuePreview}</p>
                        </div>
                        
                        <div className="flex justify-end mt-3 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(item.key);
                              toast({
                                title: "Clé copiée",
                                description: `La clé "${item.key}" a été copiée dans le presse-papiers.`
                              });
                            }}
                          >
                            Copier la clé
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => {
                              setNewMapping({
                                ...newMapping,
                                ghl_field_key: item.key,
                                chatbot_parameter: 'welcome_message'
                              });
                              setShowWelcomeMessagePreview(false);
                              toast({
                                title: "Valeur sélectionnée",
                                description: `"${item.key}" est maintenant prêt à être mappé comme message d'accueil.`
                              });
                            }}
                          >
                            Utiliser comme Welcome Message
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ) : (
              <div className="text-center py-6">
                <p>Aucun message d'accueil potentiel trouvé</p>
                
                {debugData?.textContentFields && debugData.textContentFields.length > 0 && (
                  <div className="mt-6">
                    <p className="font-medium mb-3">Autres champs avec contenu textuel</p>
                    <Accordion type="single" collapsible className="w-full">
                      {debugData.textContentFields.map((item: any, index: number) => (
                        <AccordionItem key={index} value={`text-content-${index}`}>
                          <AccordionTrigger>
                            <div className="text-left">
                              <div className="font-medium">{item.name || item.key}</div>
                              <div className="text-xs text-muted-foreground">{item.key}</div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="p-4 bg-muted rounded-md">
                              <p>{item.valuePreview}</p>
                            </div>
                            
                            <div className="flex justify-end mt-3">
                              <Button 
                                size="sm"
                                onClick={() => {
                                  setNewMapping({
                                    ...newMapping,
                                    ghl_field_key: item.key,
                                    chatbot_parameter: 'welcome_message'
                                  });
                                  setShowWelcomeMessagePreview(false);
                                }}
                              >
                                Utiliser comme Welcome Message
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWelcomeMessagePreview(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
