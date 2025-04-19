import React from 'react';
import { GhlFieldMapping } from '@/types/ghl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TestTube } from 'lucide-react';

interface FieldMappingItemProps {
  mapping: GhlFieldMapping;
  onUpdate: (mapping: GhlFieldMapping) => void;
  onDelete: (id: string) => void;
  onTest: (ghlFieldKey: string) => void;
}

export const FieldMappingItem: React.FC<FieldMappingItemProps> = React.memo(({ 
  mapping, 
  onUpdate, 
  onDelete, 
  onTest 
}) => {
  const handleFieldTypeChange = (value: string) => {
    onUpdate({ ...mapping, field_type: value as 'custom_value' | 'custom_field' });
  };

  const handleGhlFieldKeyChange = (value: string) => {
    onUpdate({ ...mapping, ghl_field_key: value });
  };

  return (
    <div 
      className="flex items-center gap-4 p-4 border rounded-lg"
      role="group"
      aria-labelledby={`mapping-${mapping.id}-label`}
    >
      <div className="flex-1">
        <Label id={`mapping-${mapping.id}-label`} htmlFor={`field-type-${mapping.id}`}>
          Type de champ
        </Label>
        <Select 
          value={mapping.field_type} 
          onValueChange={handleFieldTypeChange}
          aria-labelledby={`mapping-${mapping.id}-label`}
        >
          <SelectTrigger id={`field-type-${mapping.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom_value">Valeur personnalisée</SelectItem>
            <SelectItem value="custom_field">Champ personnalisé</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex-1">
        <Label htmlFor={`ghl-field-${mapping.id}`}>
          Clé GHL
        </Label>
        <Input
          id={`ghl-field-${mapping.id}`}
          value={mapping.ghl_field_key}
          onChange={(e) => handleGhlFieldKeyChange(e.target.value)}
          placeholder="Entrez la clé GHL"
          aria-describedby={`ghl-field-${mapping.id}-description`}
        />
        <p id={`ghl-field-${mapping.id}-description`} className="text-sm text-muted-foreground">
          Format: custom_values.nom_du_champ
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onTest(mapping.ghl_field_key)}
          aria-label={`Tester la clé ${mapping.ghl_field_key}`}
        >
          <TestTube className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="destructive"
          onClick={() => onDelete(mapping.id)}
          aria-label={`Supprimer le mapping ${mapping.ghl_field_key}`}
        >
          Supprimer
        </Button>
      </div>
    </div>
  );
}); 