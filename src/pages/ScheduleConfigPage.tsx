import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProfessionalSchedule } from '@/hooks/useProfessionalSchedule';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Plus, Trash2, CalendarDays, Clock, Ban, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda-feira', short: 'Seg' },
  { value: 2, label: 'Terça-feira', short: 'Ter' },
  { value: 3, label: 'Quarta-feira', short: 'Qua' },
  { value: 4, label: 'Quinta-feira', short: 'Qui' },
  { value: 5, label: 'Sexta-feira', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];

export default function ScheduleConfigPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [blockDate, setBlockDate] = useState<Date | undefined>();
  const [blockStartTime, setBlockStartTime] = useState('');
  const [blockEndTime, setBlockEndTime] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockFullDay, setBlockFullDay] = useState(true);
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [isAddingBlock, setIsAddingBlock] = useState(false);

  const { 
    schedules, 
    blocks, 
    isLoading, 
    initializeSchedule,
    toggleDayAvailability,
    addTimeSlot,
    removeTimeSlot,
    addBlock,
    removeBlock 
  } = useProfessionalSchedule(userId || undefined);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        navigate('/auth');
      }
    };
    getUser();
  }, [navigate]);

  useEffect(() => {
    if (userId && schedules.length === 0 && !isLoading) {
      initializeSchedule();
    }
  }, [userId, schedules.length, isLoading, initializeSchedule]);

  const handleAddTimeSlot = async () => {
    if (selectedDay === null) return;
    setIsAddingSlot(true);
    await addTimeSlot(selectedDay, newStartTime, newEndTime);
    setIsAddingSlot(false);
    setNewStartTime('09:00');
    setNewEndTime('10:00');
  };

  const handleAddBlock = async () => {
    if (!blockDate) return;
    setIsAddingBlock(true);
    await addBlock(
      format(blockDate, 'yyyy-MM-dd'),
      blockFullDay ? undefined : blockStartTime,
      blockFullDay ? undefined : blockEndTime,
      blockReason || undefined
    );
    setIsAddingBlock(false);
    setBlockDate(undefined);
    setBlockStartTime('');
    setBlockEndTime('');
    setBlockReason('');
    setBlockFullDay(true);
  };

  const getScheduleForDay = (dayOfWeek: number) => {
    return schedules.find(s => s.day_of_week === dayOfWeek);
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Configurar Agenda</h1>
            <p className="text-muted-foreground text-sm">Defina seus horários disponíveis</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Disponibilidade Semanal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Disponibilidade Semanal
              </CardTitle>
              <CardDescription>
                Configure os dias e horários em que você está disponível
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DAYS_OF_WEEK.map((day) => {
                const schedule = getScheduleForDay(day.value);
                const isAvailable = schedule?.is_available ?? false;

                return (
                  <div key={day.value} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={isAvailable}
                          onCheckedChange={(checked) => toggleDayAvailability(day.value, checked)}
                        />
                        <span className={cn(
                          "font-medium",
                          !isAvailable && "text-muted-foreground"
                        )}>
                          {day.label}
                        </span>
                      </div>
                      {isAvailable && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedDay(day.value)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Horário
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Adicionar Horário - {day.label}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Início</Label>
                                  <Input
                                    type="time"
                                    value={newStartTime}
                                    onChange={(e) => setNewStartTime(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Fim</Label>
                                  <Input
                                    type="time"
                                    value={newEndTime}
                                    onChange={(e) => setNewEndTime(e.target.value)}
                                  />
                                </div>
                              </div>
                              <Button 
                                className="w-full" 
                                onClick={handleAddTimeSlot}
                                disabled={isAddingSlot}
                              >
                                {isAddingSlot ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Adicionar Horário
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    {isAvailable && schedule?.time_slots && schedule.time_slots.length > 0 && (
                      <div className="flex flex-wrap gap-2 ml-12">
                        {schedule.time_slots.map((slot) => (
                          <Badge 
                            key={slot.id} 
                            variant="secondary"
                            className="flex items-center gap-1 py-1"
                          >
                            <Clock className="h-3 w-3" />
                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            <button
                              onClick={() => removeTimeSlot(slot.id)}
                              className="ml-1 hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {isAvailable && (!schedule?.time_slots || schedule.time_slots.length === 0) && (
                      <p className="text-sm text-muted-foreground ml-12">
                        Nenhum horário configurado
                      </p>
                    )}

                    {day.value < 6 && <Separator />}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Bloqueios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Bloqueios de Agenda
              </CardTitle>
              <CardDescription>
                Adicione férias, feriados ou compromissos específicos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Adicionar Bloqueio */}
              <div className="space-y-4 p-4 border rounded-lg">
                <Label>Adicionar novo bloqueio</Label>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {blockDate ? format(blockDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={blockDate}
                      onSelect={setBlockDate}
                      disabled={(date) => date < new Date()}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={blockFullDay}
                    onCheckedChange={setBlockFullDay}
                    id="full-day"
                  />
                  <Label htmlFor="full-day">Bloquear dia inteiro</Label>
                </div>

                {!blockFullDay && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Início</Label>
                      <Input
                        type="time"
                        value={blockStartTime}
                        onChange={(e) => setBlockStartTime(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fim</Label>
                      <Input
                        type="time"
                        value={blockEndTime}
                        onChange={(e) => setBlockEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Motivo (opcional)</Label>
                  <Textarea
                    placeholder="Ex: Férias, consulta médica..."
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    rows={2}
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleAddBlock}
                  disabled={!blockDate || isAddingBlock || (!blockFullDay && (!blockStartTime || !blockEndTime))}
                >
                  {isAddingBlock ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Adicionar Bloqueio
                </Button>
              </div>

              <Separator />

              {/* Lista de Bloqueios */}
              <div>
                <Label className="mb-3 block">Bloqueios ativos</Label>
                {blocks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum bloqueio configurado
                  </p>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {blocks.map((block) => (
                        <div 
                          key={block.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {format(new Date(block.block_date + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {block.start_time && block.end_time
                                ? `${formatTime(block.start_time)} - ${formatTime(block.end_time)}`
                                : 'Dia inteiro'}
                              {block.reason && ` • ${block.reason}`}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBlock(block.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
