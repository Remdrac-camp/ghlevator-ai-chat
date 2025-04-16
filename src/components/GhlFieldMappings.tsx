
import React from 'react';
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
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, TestTube } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

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

export const GhlFieldMappings: React.FC<GhlFieldMappingsProps> = ({ chatbotId }) => {
  const { toast } = useToast();
  const [showDebugDialog, setShowDebugDialog] = React.useState(false);
  const [debugData, setDebugData] = React.useState<any>(null);
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
      const { data, error } = await supabase
        .from('ghl_field_mappings')
        .insert([mapping])
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
      const { data: mapping } = await supabase
        .from('ghl_field_mappings')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .eq('ghl_field_key', ghlFieldKey)
        .single();

      if (!mapping) {
        throw new Error('Mapping not found');
      }

      if (!mapping.location_id) {
        throw new Error('Location ID non configuré pour ce mapping');
      }

      // Récupérer le paramètre actuel que nous testons
      const parameterLabel = CHATBOT_PARAMETERS.find(p => p.value === mapping.chatbot_parameter)?.label || mapping.chatbot_parameter;
      
      const { data, error } = await supabase.functions.invoke('test-ghl-field', {
        body: {
          locationId: mapping.location_id,
          ghlApiKey: mapping.location_id ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6IkdHSnozZFBvZ2t5ZnF4NDM3d01IIiwidmVyc2lvbiI6MSwiaWF0IjoxNzQzNTg0MTUwMzYxLCJzdWIiOiJDbkxiTWZ0OVpydzRacllzNlB3ayJ9.07VgsMsZs2C0-oyiqlyfxm4PmSZcdcsDdvYHe4plKHc" : '',
          fieldKey: parameterLabel
        }
      });

      if (error) throw error;
      
      // Sauvegarder les données de débogage complètes
      setDebugData(data);
      
      return { 
        ...data, 
        mappingType: mapping.field_type,
        fieldKey: ghlFieldKey,
        parameterLabel: parameterLabel
      };
    },
    onSuccess: (data) => {
      // Afficher le toast avec des informations plus détaillées
      toast({
        title: data.found ? `Valeur trouvée pour "${data.parameterLabel}"` : `Valeur non trouvée pour "${data.parameterLabel}"`,
        description: data.found 
          ? `Valeur: ${data.value} (Clé GHL: ${data.key})` 
          : "Aucune valeur correspondante trouvée dans GHL. Cliquez sur 'Afficher les détails' pour plus d'informations.",
        variant: data.found ? "default" : "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => setShowDebugDialog(true)}>
            Afficher les détails
          </Button>
        )
      });
    },
    onError: (error) => {
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
              <Input 
                placeholder="Ex: openai_key"
                value={newMapping.ghl_field_key || ''}
                onChange={(e) => setNewMapping({ ...newMapping, ghl_field_key: e.target.value })}
              />
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

            <Button onClick={handleAddMapping} disabled={addMappingMutation.isPending}>
              Ajouter le mapping
            </Button>
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
                      <p className="text-yellow-500">Aucune valeur correspondante trouvée</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Toutes les clés disponibles dans GHL</h3>
                  <div className="bg-muted p-3 rounded-md max-h-60 overflow-y-auto">
                    {debugData.allKeys?.length > 0 ? (
                      <ul className="space-y-2">
                        {debugData.allKeys.map((item: any, index: number) => (
                          <li key={index} className="border-b border-border pb-1">
                            <span className="font-semibold">Clé:</span> {item.key}
                            {item.name && <span className="ml-2">(<span className="font-semibold">Nom:</span> {item.name})</span>}
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
    </>
  );
};
