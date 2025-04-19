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
import { useGhlMappings } from '@/hooks/useGhlMappings';
import { FieldMappingItem } from '@/components/ghl/FieldMappingItem';
import { GhlFieldMapping } from '@/types/ghl';

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

const extractGhlIds = (jwt: string): { locationId?: string; companyId?: string; isValid: boolean } => {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return { isValid: false };
    
    const payload = JSON.parse(atob(parts[1]));
    
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

const formatGhlKey = (key: string): string => {
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
    chatbot_parameter: 'openai_key' | 'system_prompt' | 'welcome_message' | 'temperature' | 'max_tokens';
  }>({
    chatbot_id: chatbotId,
    field_type: 'custom_value',
    ghl_field_key: '',
    chatbot_parameter: 'openai_key',
  });

  const {
    mappings,
    isLoading,
    createMapping,
    updateMapping,
    deleteMapping,
    isCreating,
  } = useGhlMappings(chatbotId);

  const addMappingMutation = useMutation({
    mutationFn: async (mapping: {
      chatbot_id: string;
      field_type: string;
      ghl_field_key: string;
      chatbot_parameter: string;
    }) => {
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
        ghl_field_key: '',
        chatbot_parameter: 'openai_key',
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

  const testGhlValueMutation = useMutation({
    mutationFn: async (ghlFieldKey: string) => {
      let locationId = localStorage.getItem('ghlLocationId');
      const ghlApiKey = localStorage.getItem('ghlApiKey');
      
      console.log('LocationID from localStorage:', locationId);
      console.log('GHL API Key available:', !!ghlApiKey);
      
      if (!ghlApiKey) {
        toast({
          title: "API GHL manquante",
          description: "Aucune clé API GHL trouvée. Veuillez configurer l'intégration GHL d'abord.",
          variant: "destructive",
        });
        throw new Error('No GHL API key found in local storage');
      }
      
      if (!locationId && ghlApiKey) {
        console.log('Tentative d\'extraction du locationId depuis le JWT...');
        const extracted = extractGhlIds(ghlApiKey);
        if (extracted.isValid && extracted.locationId) {
          locationId = extracted.locationId;
          localStorage.setItem('ghlLocationId', locationId);
          console.log('LocationID extrait du JWT et stocké:', locationId);
        } else if (extracted.isValid && extracted.companyId) {
          console.log('CompanyID trouvé, mais pas de LocationID. CompanyID:', extracted.companyId);
        }
      }
      
      const mapping = mappings?.find(m => m.ghl_field_key === ghlFieldKey);
      if (!mapping) {
        throw new Error('Mapping not found');
      }
      
      const parameterInfo = CHATBOT_PARAMETERS.find(p => p.value === mapping.chatbot_parameter);
      const parameterLabel = parameterInfo?.label || mapping.chatbot_parameter;
      
      let searchKey = ghlFieldKey;
      if (searchKey.includes('custom_values.')) {
        searchKey = searchKey.split('custom_values.')[1].replace('}}', '').trim();
      }
      if (mapping.chatbot_parameter === 'openai_key') {
        searchKey = 'OpenAI Key';
      } else if (mapping.chatbot_parameter === 'welcome_message') {
        searchKey = 'welcome_message';
      }
      
      console.log(`Testing GHL field: ${searchKey} for parameter: ${parameterLabel}`);
      console.log(`Using locationId: ${locationId}`);

      const response = await supabase.functions.invoke('test-ghl-field', {
        body: {
          locationId: locationId,
          ghlApiKey: ghlApiKey,
          fieldKey: searchKey
        }
      });

      const data = response.data;
      
      if (data.error) {
        console.error('Error from edge function:', data.error);
        throw new Error(data.error);
      }
      
      setDebugData(data);

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
      
      setDebugData({
        error: error.message,
        found: false
      });
      
      setShowDebugDialog(true);
    },
  });

  const handleAddMapping = () => {
    createMapping({
      chatbot_id: chatbotId,
      field_type: 'custom_value',
      ghl_field_key: '',
      chatbot_parameter: 'openai_key',
    });
  };

  const handleTestMapping = (ghlFieldKey: string) => {
    testGhlValueMutation.mutate(ghlFieldKey);
  };

  const findWelcomeMessages = async () => {
    let locationId = localStorage.getItem('ghlLocationId');
    console.log('LocationID from localStorage:', locationId);

    const ghlApiKey = localStorage.getItem('ghlApiKey');
    console.log('GHL API Key available:', !!ghlApiKey);
    
    if (!locationId && ghlApiKey) {
      console.log('Tentative d\'extraction du locationId depuis le JWT...');
      const extracted = extractGhlIds(ghlApiKey);
      if (extracted.isValid && extracted.locationId) {
        locationId = extracted.locationId;
        localStorage.setItem('ghlLocationId', locationId);
        console.log('LocationID extrait du JWT et stocké:', locationId);
      } else if (extracted.isValid && extracted.companyId) {
        console.log('CompanyID trouvé, mais pas de LocationID. CompanyID:', extracted.companyId);
      }
    }

    if (!ghlApiKey) {
      toast({
        title: "API GHL manquante",
        description: "Aucune clé API GHL trouvée. Veuillez configurer l'intégration GHL dans la page Intégrations.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await supabase.functions.invoke('test-ghl-field', {
        body: {
          locationId: locationId,
          ghlApiKey: ghlApiKey,
          fieldKey: "welcome_message"
        }
      });

      const data = response.data;
      
      if (data.error) {
        toast({
          title: "Erreur",
          description: `Erreur lors de la recherche des messages d'accueil: ${data.error}`,
          variant: "destructive",
        });
        
        setDebugData(data);
        setShowDebugDialog(true);
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
    } catch (error: any) {
      console.error('Error searching for welcome messages:', error);
      toast({
        title: "Erreur",
        description: `Erreur lors de la recherche des messages d'accueil: ${error.message}`,
        variant: "destructive",
      });
      
      setDebugData({
        error: error.message,
        found: false
      });
      
      setShowDebugDialog(true);
    }
  };

  useEffect(() => {
    const checkGhlConfiguration = async () => {
      let locationId = localStorage.getItem('ghlLocationId');
      const ghlApiKey = localStorage.getItem('ghlApiKey');
      
      if (!locationId && ghlApiKey) {
        console.log("Tentative d'extraire le locationId depuis le JWT au chargement...");
        const extracted = extractGhlIds(ghlApiKey);
        
        if (extracted.isValid && extracted.locationId) {
          locationId = extracted.locationId;
          localStorage.setItem('ghlLocationId', locationId);
          console.log("LocationID extrait et sauvegardé:", locationId);
        }
      }
      
      if (ghlApiKey) {
        console.log("Clé API GHL disponible au chargement.");
      } else {
        toast({
          title: "Configuration GHL incomplète",
          description: "Clé API GHL non trouvée. Configurez l'intégration GHL dans la page Intégrations.",
          variant: "destructive",
        });
      }
    };
    
    checkGhlConfiguration();
  }, [toast]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>GHL Field Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mappings?.map((mapping) => (
              <FieldMappingItem
                key={mapping.id}
                mapping={mapping}
                onUpdate={updateMapping}
                onDelete={deleteMapping}
                onTest={handleTestMapping}
              />
            ))}
            <Button
              onClick={handleAddMapping}
              disabled={isCreating}
            >
              Add Mapping
            </Button>
          </div>
        </CardContent>
      </Card>

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
