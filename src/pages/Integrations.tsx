
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  Globe2,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  Plus,
  Trash2,
  Building2,
  Settings2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { GhlAccount } from '@/types';

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

const Integrations = () => {
  const { toast } = useToast();
  const [ghlApiKey, setGhlApiKey] = useState('');
  const [ghlAccountName, setGhlAccountName] = useState('');
  const [isAgencyMode, setIsAgencyMode] = useState(false);
  const [subAccounts, setSubAccounts] = useState<GhlAccount[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<GhlAccount | null>(null);
  const { apiKeys, updateApiKeys } = useAuth();
  const [ghlIds, setGhlIds] = useState<{ locationId?: string; companyId?: string; isValid: boolean }>({ isValid: false });

  useEffect(() => {
    // Mise à jour des IDs lorsque la clé API change
    if (ghlApiKey) {
      const extracted = extractGhlIds(ghlApiKey);
      setGhlIds(extracted);
    } else {
      setGhlIds({ isValid: false });
    }
  }, [ghlApiKey]);

  useEffect(() => {
    // Charger les sous-comptes sauvegardés depuis localStorage s'ils existent
    const savedSubAccounts = localStorage.getItem('ghlSubAccounts');
    if (savedSubAccounts) {
      setSubAccounts(JSON.parse(savedSubAccounts));
    }

    // Vérifier si le mode agence était activé
    const agencyMode = localStorage.getItem('ghlAgencyMode') === 'true';
    setIsAgencyMode(agencyMode);
    
    // Si une clé API GoHighLevel existe déjà, extraire ses IDs
    if (apiKeys.goHighLevel) {
      const extracted = extractGhlIds(apiKeys.goHighLevel);
      setGhlIds(extracted);
      setGhlApiKey(apiKeys.goHighLevel);
    }
  }, [apiKeys.goHighLevel]);

  const saveSubAccounts = (accounts: GhlAccount[]) => {
    setSubAccounts(accounts);
    localStorage.setItem('ghlSubAccounts', JSON.stringify(accounts));
  };

  const handleConnect = () => {
    if (!ghlApiKey) {
      toast({
        title: "Information manquante",
        description: "Veuillez fournir votre clé API GoHighLevel.",
        variant: "destructive",
      });
      return;
    }

    if (!ghlIds.isValid) {
      toast({
        title: "Clé API invalide",
        description: "La clé API fournie n'est pas valide ou ne contient pas d'ID de location ou d'agence.",
        variant: "destructive",
      });
      return;
    }

    // Sauvegarder la connexion principale de l'agence
    updateApiKeys({ goHighLevel: ghlApiKey });
    localStorage.setItem('ghlAgencyMode', isAgencyMode.toString());
    
    // Sauvegarder les IDs dans le localStorage avec des clés plus précises
    if (ghlIds.locationId) {
      localStorage.setItem('ghlLocationId', ghlIds.locationId);
    }
    
    if (ghlIds.companyId) {
      localStorage.setItem('ghlCompanyId', ghlIds.companyId);
      localStorage.setItem('ghlIsAgencyAccount', 'true');
    } else {
      localStorage.setItem('ghlIsAgencyAccount', 'false');
    }
    
    toast({
      title: "Intégration réussie",
      description: ghlIds.companyId 
        ? "Votre compte Agence GoHighLevel a été connecté avec succès." 
        : "Votre compte GoHighLevel a été connecté avec succès.",
    });
  };

  const openAddSubAccountDialog = () => {
    setEditingAccount(null);
    setGhlAccountName('');
    setGhlApiKey('');
    setIsDialogOpen(true);
  };

  const openEditSubAccountDialog = (account: GhlAccount) => {
    setEditingAccount(account);
    setGhlAccountName(account.name);
    setGhlApiKey(account.apiKey);
    setIsDialogOpen(true);
  };

  const handleSaveSubAccount = () => {
    if (!ghlAccountName || !ghlApiKey) {
      toast({
        title: "Information manquante",
        description: "Veuillez remplir tous les champs pour le sous-compte.",
        variant: "destructive",
      });
      return;
    }

    const extracted = extractGhlIds(ghlApiKey);
    
    if (!extracted.isValid) {
      toast({
        title: "Clé API invalide",
        description: "La clé API fournie n'est pas valide ou ne contient pas d'ID de location ou d'agence.",
        variant: "destructive",
      });
      return;
    }

    if (editingAccount) {
      // Mettre à jour le sous-compte existant
      const updatedAccounts = subAccounts.map(account => 
        account.id === editingAccount.id 
          ? { 
              ...account, 
              name: ghlAccountName,
              apiKey: ghlApiKey,
              locationId: extracted.locationId,
              companyId: extracted.companyId
            } 
          : account
      );
      saveSubAccounts(updatedAccounts);
    } else {
      // Ajouter un nouveau sous-compte
      const newAccount: GhlAccount = {
        id: `account-${Date.now()}`,
        name: ghlAccountName,
        apiKey: ghlApiKey,
        locationId: extracted.locationId,
        companyId: extracted.companyId,
        active: true
      };
      saveSubAccounts([...subAccounts, newAccount]);
    }

    // Effacer le formulaire
    setGhlAccountName('');
    setGhlApiKey('');
    setIsDialogOpen(false);

    toast({
      title: editingAccount ? "Sous-compte mis à jour" : "Sous-compte ajouté",
      description: editingAccount 
        ? `Le sous-compte ${ghlAccountName} a été mis à jour avec succès.`
        : `Le sous-compte ${ghlAccountName} a été ajouté avec succès.`,
    });
  };

  const deleteSubAccount = (id: string) => {
    const accountName = subAccounts.find(account => account.id === id)?.name;
    const updatedAccounts = subAccounts.filter(account => account.id !== id);
    saveSubAccounts(updatedAccounts);
    
    toast({
      title: "Sous-compte supprimé",
      description: `Le sous-compte ${accountName} a été supprimé avec succès.`,
    });
  };

  const toggleSubAccountStatus = (id: string) => {
    const updatedAccounts = subAccounts.map(account => 
      account.id === id ? { ...account, active: !account.active } : account
    );
    saveSubAccounts(updatedAccounts);
    
    const account = updatedAccounts.find(a => a.id === id);
    toast({
      title: account?.active ? "Sous-compte activé" : "Sous-compte désactivé",
      description: `Le sous-compte ${account?.name} a été ${account?.active ? "activé" : "désactivé"}.`,
    });
  };

  // Détermine le type de compte GHL
  const accountType = ghlIds.companyId ? "Compte Agence" : ghlIds.locationId ? "Compte Location" : "Non détecté";

  return (
    <Layout requiresAuth>
      <div className="container mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Intégrations</h1>
          <p className="text-muted-foreground">
            Connectez votre compte GoHighLevel pour activer l'intégration du chatbot
          </p>
        </header>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Configuration Principale GoHighLevel</CardTitle>
                <CardDescription>
                  Configurez les paramètres de votre compte agence principal
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">Clé API (JWT Token)</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={ghlApiKey}
                  onChange={(e) => setGhlApiKey(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Trouvez votre clé API JWT dans les paramètres de votre compte GoHighLevel
                </p>
              </div>

              {ghlIds.isValid && (
                <div className="rounded-lg bg-muted p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium">
                        {accountType}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {ghlIds.companyId ? `ID d'agence: ${ghlIds.companyId}` : 
                         ghlIds.locationId ? `ID de location: ${ghlIds.locationId}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="agencyMode"
                  checked={isAgencyMode}
                  onCheckedChange={setIsAgencyMode}
                />
                <Label htmlFor="agencyMode">Mode Agence (gérer plusieurs comptes clients)</Label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleConnect} className="gap-2">
                <span>Connecter GoHighLevel</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {isAgencyMode && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe2 className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle>Comptes Clients GoHighLevel</CardTitle>
                    <CardDescription>
                      Gérez les comptes clients liés à votre compte agence
                    </CardDescription>
                  </div>
                </div>
                <Button onClick={openAddSubAccountDialog} className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Ajouter un compte client</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {subAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Aucun compte client n'a été ajouté.</p>
                  <p className="text-sm">Cliquez sur "Ajouter un compte client" pour commencer.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {subAccounts.map((account) => (
                    <div 
                      key={account.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-background"
                    >
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={account.active}
                          onCheckedChange={() => toggleSubAccountStatus(account.id)}
                        />
                        <div>
                          <h3 className="font-medium">{account.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {account.companyId 
                              ? `Company ID: ${account.companyId}` 
                              : `Location ID: ${account.locationId}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => openEditSubAccountDialog(account)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => deleteSubAccount(account.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Statut de l'intégration</CardTitle>
                <CardDescription>
                  État actuel de votre intégration GoHighLevel
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  <span>Connexion API Principale</span>
                </div>
                <span className={apiKeys.goHighLevel ? "text-green-500" : "text-yellow-500"}>
                  {apiKeys.goHighLevel ? "Connectée" : "Non connectée"}
                </span>
              </div>
              {isAgencyMode && (
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-muted-foreground" />
                    <span>Comptes clients actifs</span>
                  </div>
                  <span className="text-green-500">
                    {subAccounts.filter(acc => acc.active).length}/{subAccounts.length}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dialog pour ajouter/modifier des comptes clients */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? "Modifier le compte client" : "Ajouter un compte client"}
              </DialogTitle>
              <DialogDescription>
                {editingAccount 
                  ? "Modifiez les informations du compte client GoHighLevel."
                  : "Ajoutez un nouveau compte client à votre agence GoHighLevel."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="accountName">Nom du compte</Label>
                <Input
                  id="accountName"
                  placeholder="Nom du client"
                  value={ghlAccountName}
                  onChange={(e) => setGhlAccountName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accountApiKey">Clé API (JWT Token)</Label>
                <Input
                  id="accountApiKey"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={ghlApiKey}
                  onChange={(e) => setGhlApiKey(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Collez le token JWT généré pour ce compte client
                </p>
              </div>

              {ghlIds.isValid && (
                <div className="rounded-lg bg-muted p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium">
                        {accountType}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {ghlIds.companyId ? `ID d'agence: ${ghlIds.companyId}` : 
                         ghlIds.locationId ? `ID de location: ${ghlIds.locationId}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveSubAccount}>
                {editingAccount ? "Mettre à jour" : "Ajouter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Integrations;
