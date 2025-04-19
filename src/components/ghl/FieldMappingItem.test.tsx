import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FieldMappingItem } from './FieldMappingItem';
import { GhlFieldMapping } from '@/types/ghl';

describe('FieldMappingItem', () => {
  const mockMapping: GhlFieldMapping = {
    id: '1',
    chatbot_id: 'chatbot-1',
    field_type: 'custom_value',
    ghl_field_key: 'test-key',
    chatbot_parameter: 'openai_key',
  };

  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnTest = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(
      <FieldMappingItem
        mapping={mockMapping}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
      />
    );

    expect(screen.getByLabelText('Field Type')).toBeInTheDocument();
    expect(screen.getByLabelText('GHL Field Key')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('calls onUpdate when field type changes', () => {
    render(
      <FieldMappingItem
        mapping={mockMapping}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
      />
    );

    const select = screen.getByLabelText('Field Type');
    fireEvent.change(select, { target: { value: 'custom_field' } });

    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockMapping,
      field_type: 'custom_field',
    });
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <FieldMappingItem
        mapping={mockMapping}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockMapping.id);
  });

  it('calls onTest when test button is clicked', () => {
    render(
      <FieldMappingItem
        mapping={mockMapping}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
      />
    );

    const testButton = screen.getByRole('button', { name: /test/i });
    fireEvent.click(testButton);

    expect(mockOnTest).toHaveBeenCalledWith(mockMapping.ghl_field_key);
  });
}); 