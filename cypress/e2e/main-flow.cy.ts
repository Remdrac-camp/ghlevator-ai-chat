describe('Flux principal de l\'application', () => {
  beforeEach(() => {
    // Configuration initiale
    cy.visit('/');
    cy.login(); // Commande personnalisée à définir dans cypress/support/commands.ts
  });

  it('devrait permettre la création et la gestion des mappings GHL', () => {
    // 1. Accès à la page des mappings
    cy.get('[data-testid="nav-ghl-mappings"]').click();
    
    // 2. Vérification de la page vide
    cy.get('[data-testid="empty-state"]').should('be.visible');
    
    // 3. Ajout d'un nouveau mapping
    cy.get('[data-testid="add-mapping-button"]').click();
    
    // 4. Remplissage du formulaire
    cy.get('[data-testid="field-type-select"]').click();
    cy.get('[data-testid="field-type-option-custom_value"]').click();
    
    cy.get('[data-testid="ghl-field-input"]').type('custom_values.test_field');
    cy.get('[data-testid="chatbot-parameter-input"]').type('openai_key');
    
    // 5. Sauvegarde
    cy.get('[data-testid="save-mapping-button"]').click();
    
    // 6. Vérification de l'affichage
    cy.get('[data-testid="mapping-list"]').should('contain', 'custom_values.test_field');
    
    // 7. Test du mapping
    cy.get('[data-testid="test-mapping-button"]').click();
    cy.get('[data-testid="test-result"]').should('be.visible');
    
    // 8. Suppression du mapping
    cy.get('[data-testid="delete-mapping-button"]').click();
    cy.get('[data-testid="confirm-delete-button"]').click();
    
    // 9. Vérification de la suppression
    cy.get('[data-testid="empty-state"]').should('be.visible');
  });

  it('devrait gérer correctement les erreurs', () => {
    // 1. Tentative de création avec des données invalides
    cy.get('[data-testid="add-mapping-button"]').click();
    cy.get('[data-testid="save-mapping-button"]').click();
    
    // 2. Vérification des messages d'erreur
    cy.get('[data-testid="error-message"]').should('be.visible');
    
    // 3. Test de la limite de caractères
    cy.get('[data-testid="ghl-field-input"]').type('a'.repeat(101));
    cy.get('[data-testid="error-message"]').should('contain', '100 caractères');
  });
}); 