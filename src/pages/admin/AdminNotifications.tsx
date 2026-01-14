import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useMassNotifications } from "@/hooks/useMassNotifications";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, Send, Users, Briefcase, UserPlus, Loader2, History, MessageSquare } from "lucide-react";

export const AdminNotifications = () => {
  const { notifications, isLoading, isSending, sendMassNotification } = useMassNotifications();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<"all" | "clients" | "professionals">("all");

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    
    const success = await sendMassNotification({ title, message, target_type: targetType });
    if (success) {
      setTitle("");
      setMessage("");
      setTargetType("all");
      setIsDialogOpen(false);
    }
  };

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'all': return <Users className="h-4 w-4" />;
      case 'clients': return <UserPlus className="h-4 w-4" />;
      case 'professionals': return <Briefcase className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getTargetLabel = (type: string) => {
    switch (type) {
      case 'all': return 'Todos';
      case 'clients': return 'Clientes';
      case 'professionals': return 'Profissionais';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Notificações em Massa" description="Envie notificações para usuários da plataforma">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Notificações em Massa" description="Envie notificações para usuários da plataforma">
      {/* Header Actions */}
      <div className="flex justify-end mb-6">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Nova Notificação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Enviar Notificação em Massa
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="target">Destinatários</Label>
                <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> Todos os Usuários
                      </span>
                    </SelectItem>
                    <SelectItem value="clients">
                      <span className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" /> Apenas Clientes
                      </span>
                    </SelectItem>
                    <SelectItem value="professionals">
                      <span className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" /> Apenas Profissionais
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input 
                  id="title" 
                  placeholder="Título da notificação..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea 
                  id="message" 
                  placeholder="Digite a mensagem..."
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSend} 
                disabled={isSending || !title.trim() || !message.trim()}
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Notificação
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications.length}</p>
                <p className="text-sm text-muted-foreground">Total Enviadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {notifications.reduce((sum, n) => sum + n.recipients_count, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Destinatários</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <History className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => {
                    const sentDate = new Date(n.sent_at);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return sentDate >= weekAgo;
                  }).length}
                </p>
                <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Notificações
          </CardTitle>
          <CardDescription>Últimas notificações enviadas</CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma notificação enviada ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold">{notification.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        {getTargetIcon(notification.target_type)}
                        {getTargetLabel(notification.target_type)}
                      </Badge>
                      <Badge variant="secondary">
                        {notification.recipients_count} destinatários
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Enviada em {format(new Date(notification.sent_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminNotifications;
