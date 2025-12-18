import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useBankAccounts, CreateBankAccountData, BankAccount } from '@/hooks/useBankAccounts';
import { Plus, Trash2, Star, Building2, CreditCard, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const BANKS = [
  { code: '001', name: 'Banco do Brasil' },
  { code: '033', name: 'Santander' },
  { code: '104', name: 'Caixa Econômica Federal' },
  { code: '237', name: 'Bradesco' },
  { code: '341', name: 'Itaú' },
  { code: '260', name: 'Nubank' },
  { code: '077', name: 'Inter' },
  { code: '212', name: 'Banco Original' },
  { code: '336', name: 'C6 Bank' },
  { code: '380', name: 'PicPay' },
  { code: '290', name: 'PagBank' },
];

const PIX_KEY_TYPES = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'aleatoria', label: 'Chave Aleatória' },
];

export default function BankAccountsPage() {
  const { accounts, isLoading, createAccount, deleteAccount, setDefaultAccount } = useBankAccounts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [accountType, setAccountType] = useState<'pix' | 'conta_corrente' | 'conta_poupanca'>('pix');
  const [pixKeyType, setPixKeyType] = useState<string>('');
  const [pixKey, setPixKey] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [agency, setAgency] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [holderDocument, setHolderDocument] = useState('');

  const resetForm = () => {
    setAccountType('pix');
    setPixKeyType('');
    setPixKey('');
    setBankCode('');
    setAgency('');
    setAccountNumber('');
    setHolderName('');
    setHolderDocument('');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const data: CreateBankAccountData = {
      account_type: accountType,
      account_holder_name: holderName,
      account_holder_document: holderDocument,
      is_default: accounts.length === 0,
    };

    if (accountType === 'pix') {
      data.pix_key_type = pixKeyType as any;
      data.pix_key = pixKey;
    } else {
      const bank = BANKS.find(b => b.code === bankCode);
      data.bank_code = bankCode;
      data.bank_name = bank?.name;
      data.agency = agency;
      data.account_number = accountNumber;
    }

    const success = await createAccount(data);
    setIsSubmitting(false);
    
    if (success) {
      setIsDialogOpen(false);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteAccount(deleteId);
    setDeleteId(null);
  };

  const formatAccountDisplay = (account: BankAccount) => {
    if (account.account_type === 'pix') {
      return `PIX: ${account.pix_key}`;
    }
    return `Ag: ${account.agency} | Conta: ${account.account_number}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid gap-4">
            {[1, 2].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/carteira">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-heading">Contas Bancárias</h1>
            <p className="text-muted-foreground">Gerencie suas contas para receber saques</p>
          </div>
        </div>

        <div className="grid gap-4 max-w-2xl">
          {accounts.map(account => (
            <Card key={account.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {account.account_type === 'pix' ? (
                        <CreditCard className="h-5 w-5 text-primary" />
                      ) : (
                        <Building2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {account.account_type === 'pix' 
                            ? `PIX - ${PIX_KEY_TYPES.find(t => t.value === account.pix_key_type)?.label}`
                            : `${account.bank_name} - ${account.account_type === 'conta_corrente' ? 'Conta Corrente' : 'Conta Poupança'}`
                          }
                        </p>
                        {account.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Padrão
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatAccountDisplay(account)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Titular: {account.account_holder_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!account.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefaultAccount(account.id)}
                      >
                        Definir padrão
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {accounts.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Você ainda não cadastrou nenhuma conta bancária.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cadastre uma conta para poder realizar saques.
                </p>
              </CardContent>
            </Card>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Conta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Conta Bancária</DialogTitle>
                <DialogDescription>
                  Cadastre uma conta para receber seus saques
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tipo de Conta</Label>
                  <Select value={accountType} onValueChange={(v: any) => setAccountType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="conta_corrente">Conta Corrente</SelectItem>
                      <SelectItem value="conta_poupanca">Conta Poupança</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {accountType === 'pix' ? (
                  <>
                    <div className="space-y-2">
                      <Label>Tipo de Chave PIX</Label>
                      <Select value={pixKeyType} onValueChange={setPixKeyType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {PIX_KEY_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Chave PIX</Label>
                      <Input
                        value={pixKey}
                        onChange={e => setPixKey(e.target.value)}
                        placeholder="Digite sua chave PIX"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Banco</Label>
                      <Select value={bankCode} onValueChange={setBankCode}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o banco" />
                        </SelectTrigger>
                        <SelectContent>
                          {BANKS.map(bank => (
                            <SelectItem key={bank.code} value={bank.code}>
                              {bank.code} - {bank.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Agência</Label>
                        <Input
                          value={agency}
                          onChange={e => setAgency(e.target.value)}
                          placeholder="0000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Conta</Label>
                        <Input
                          value={accountNumber}
                          onChange={e => setAccountNumber(e.target.value)}
                          placeholder="00000-0"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>Nome do Titular</Label>
                  <Input
                    value={holderName}
                    onChange={e => setHolderName(e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label>CPF/CNPJ do Titular</Label>
                  <Input
                    value={holderDocument}
                    onChange={e => setHolderDocument(e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting || !holderName || !holderDocument || 
                    (accountType === 'pix' ? !pixKey || !pixKeyType : !bankCode || !agency || !accountNumber)}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Cadastrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <Footer />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A conta será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
