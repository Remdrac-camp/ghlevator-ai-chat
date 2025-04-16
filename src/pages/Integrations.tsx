
import React from 'react';
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
  Webhook,
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

interface GhlSubAccount {
  id: string;
  name: string;
  subdomain: string;
  apiKey: string;
  active: boolean;
}

const Integrations = () => {
  const { toast } = useToast();
  const [ghlApiKey, setGhlApiKey] = React.useState('');
  const [ghlSubdomain, setGhlSubdomain] = React.useState('');
  const [ghlAccountName, setGhlAccountName] = React.useState('');
  const [webhookEndpoint, setWebhookEndpoint] = React.useState('');
  const [isAgencyMode, setIsAgencyMode] = React.useState(false);
  const [subAccounts, setSubAccounts] = React.useState<GhlSubAccount[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<GhlSubAccount | null>(null);
  const { apiKeys, updateApiKeys } = useAuth();

  React.useEffect(() => {
    // Set the webhook endpoint based on the current domain
    setWebhookEndpoint(`${window.location.origin}/api/ghl/webhook`);
    
    // Load saved sub-accounts from localStorage if they exist
    const savedSubAccounts = localStorage.getItem('ghlSubAccounts');
    if (savedSubAccounts) {
      setSubAccounts(JSON.parse(savedSubAccounts));
    }

    // Check if agency mode was enabled
    const agencyMode = localStorage.getItem('ghlAgencyMode') === 'true';
    setIsAgencyMode(agencyMode);
  }, []);

  const saveSubAccounts = (accounts: GhlSubAccount[]) => {
    setSubAccounts(accounts);
    localStorage.setItem('ghlSubAccounts', JSON.stringify(accounts));
  };

  const handleConnect = () => {
    if (!ghlApiKey || !ghlSubdomain) {
      toast({
        title: "Information manquante",
        description: "Veuillez fournir votre clé API GoHighLevel et votre sous-domaine.",
        variant: "destructive",
      });
      return;
    }

    // Save the main agency connection
    updateApiKeys({ goHighLevel: ghlApiKey });
    localStorage.setItem('ghlAgencyMode', isAgencyMode.toString());
    localStorage.setItem('ghlMainSubdomain', ghlSubdomain);
    
    toast({
      title: "Intégration réussie",
      description: "Votre compte GoHighLevel a été connecté avec succès.",
    });
  };

  const openAddSubAccountDialog = () => {
    setEditingAccount(null);
    setIsDialogOpen(true);
  };

  const openEditSubAccountDialog = (account: GhlSubAccount) => {
    setEditingAccount(account);
    setGhlAccountName(account.name);
    setGhlSubdomain(account.subdomain);
    setGhlApiKey(account.apiKey);
    setIsDialogOpen(true);
  };

  const handleSaveSubAccount = () => {
    if (!ghlAccountName || !ghlSubdomain || !ghlApiKey) {
      toast({
        title: "Information manquante",
        description: "Veuillez remplir tous les champs pour le sous-compte.",
        variant: "destructive",
      });
      return;
    }

    if (editingAccount) {
      // Update existing subaccount
      const updatedAccounts = subAccounts.map(account => 
        account.id === editingAccount.id 
          ? { 
              ...account, 
              name: ghlAccountName, 
              subdomain: ghlSubdomain, 
              apiKey: ghlApiKey
            } 
          : account
      );
      saveSubAccounts(updatedAccounts);
    } else {
      // Add new subaccount
      const newAccount: GhlSubAccount = {
        id: `account-${Date.now()}`,
        name: ghlAccountName,
        subdomain: ghlSubdomain,
        apiKey: ghlApiKey,
        active: true
      };
      saveSubAccounts([...subAccounts, newAccount]);
    }

    // Clear the form
    setGhlAccountName('');
    setGhlSubdomain('');
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
                <Label htmlFor="apiKey">Clé API</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Entrez votre clé API GoHighLevel"
                  value={ghlApiKey}
                  onChange={(e) => setGhlApiKey(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Trouvez votre clé API dans les paramètres de votre compte GoHighLevel
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain">Sous-domaine</Label>
                <div className="flex gap-2">
                  <Input
                    id="subdomain"
                    placeholder="votre-agence"
                    value={ghlSubdomain}
                    onChange={(e) => setGhlSubdomain(e.target.value)}
                  />
                  <span className="flex items-center text-muted-foreground">.gohighlevel.com</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="agencyMode"
                  checked={isAgencyMode}
                  onCheckedChange={setIsAgencyMode}
                />
                <Label htmlFor="agencyMode">Mode Agence (gérer plusieurs sous-comptes)</Label>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Webhook className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Configuration du Webhook</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Copiez cette URL de webhook dans vos paramètres d'intégration GoHighLevel
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={webhookEndpoint}
                      readOnly
                      className="bg-background font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(webhookEndpoint);
                        toast({
                          title: "Copié !",
                          description: "URL du webhook copiée dans le presse-papier",
                        });
                      }}
                    >
                      Copier
                    </Button>
                  </div>
                </div>
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
                    <CardTitle>Sous-comptes GoHighLevel</CardTitle>
                    <CardDescription>
                      Gérez les sous-comptes client liés à votre compte agence
                    </CardDescription>
                  </div>
                </div>
                <Button onClick={openAddSubAccountDialog} className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Ajouter un sous-compte</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {subAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Aucun sous-compte n'a été ajouté.</p>
                  <p className="text-sm">Cliquez sur "Ajouter un sous-compte" pour commencer.</p>
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
                          <p className="text-sm text-muted-foreground">{account.subdomain}.gohighlevel.com</p>
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
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Webhook className="h-4 w-4 text-muted-foreground" />
                  <span>Statut du Webhook</span>
                </div>
                <span className="text-yellow-500">En attente</span>
              </div>
              {isAgencyMode && (
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-muted-foreground" />
                    <span>Sous-comptes actifs</span>
                  </div>
                  <span className="text-green-500">
                    {subAccounts.filter(acc => acc.active).length}/{subAccounts.length}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dialog for adding/editing sub-accounts */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? "Modifier le sous-compte" : "Ajouter un sous-compte"}
              </DialogTitle>
              <DialogDescription>
                {editingAccount 
                  ? "Modifiez les informations du sous-compte GoHighLevel."
                  : "Ajoutez un nouveau sous-compte client à votre agence GoHighLevel."}
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
                <Label htmlFor="accountSubdomain">Sous-domaine</Label>
                <div className="flex gap-2">
                  <Input
                    id="accountSubdomain"
                    placeholder="sous-domaine-client"
                    value={ghlSubdomain}
                    onChange={(e) => setGhlSubdomain(e.target.value)}
                  />
                  <span className="flex items-center text-muted-foreground">.gohighlevel.com</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accountApiKey">Clé API</Label>
                <Input
                  id="accountApiKey"
                  type="password"
                  placeholder="Clé API du sous-compte"
                  value={ghlApiKey}
                  onChange={(e) => setGhlApiKey(e.target.value)}
                />
              </div>
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
