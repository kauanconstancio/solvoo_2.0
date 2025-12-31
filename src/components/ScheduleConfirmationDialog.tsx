import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Clock,
  Plus,
  X,
  Loader2,
} from "lucide-react";

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
}

interface DaySchedule {
  id: string;
  day_of_week: number;
  is_available: boolean;
  time_slots: TimeSlot[];
}

interface ScheduleConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  schedules: DaySchedule[];
  isSubmitting: boolean;
  onToggleDay?: (dayOfWeek: number, isAvailable: boolean) => Promise<void>;
  onAddTimeSlot?: (dayOfWeek: number, startTime: string, endTime: string) => Promise<void>;
  onRemoveTimeSlot?: (slotId: string) => Promise<void>;
  onInitializeSchedule?: () => Promise<void>;
}

const dayNames = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const shortDayNames = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
];

const formatTime = (time: string) => {
  return time.slice(0, 5);
};

// Gerar opções de horário de 06:00 às 22:00
const generateTimeOptions = () => {
  const options: string[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    options.push(`${hour.toString().padStart(2, "0")}:00`);
    if (hour < 22) {
      options.push(`${hour.toString().padStart(2, "0")}:30`);
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

export function ScheduleConfirmationDialog({
  open,
  onClose,
  onConfirm,
  schedules,
  isSubmitting,
  onToggleDay,
  onAddTimeSlot,
  onRemoveTimeSlot,
  onInitializeSchedule,
}: ScheduleConfirmationDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [isTogglingDay, setIsTogglingDay] = useState(false);

  const availableDays = schedules.filter((s) => s.is_available && s.time_slots.length > 0);
  const totalSlots = availableDays.reduce((acc, day) => acc + day.time_slots.length, 0);

  // Criar array completo de 7 dias
  const allDays = Array.from({ length: 7 }, (_, i) => {
    const existing = schedules.find((s) => s.day_of_week === i);
    return existing || { id: "", day_of_week: i, is_available: false, time_slots: [] };
  });

  const handleToggleDay = async (dayOfWeek: number, isAvailable: boolean) => {
    if (!onToggleDay) return;
    setIsTogglingDay(true);
    try {
      await onToggleDay(dayOfWeek, isAvailable);
    } finally {
      setIsTogglingDay(false);
    }
  };

  const handleAddSlot = async () => {
    if (!onAddTimeSlot || selectedDay === null || !newStartTime || !newEndTime) return;
    
    if (newStartTime >= newEndTime) {
      return;
    }

    setIsAddingSlot(true);
    try {
      await onAddTimeSlot(selectedDay, newStartTime, newEndTime);
      setNewStartTime("");
      setNewEndTime("");
    } finally {
      setIsAddingSlot(false);
    }
  };

  const handleRemoveSlot = async (slotId: string) => {
    if (!onRemoveTimeSlot) return;
    await onRemoveTimeSlot(slotId);
  };

  const handleInitialize = async () => {
    if (!onInitializeSchedule) return;
    await onInitializeSchedule();
    setIsEditing(true);
  };

  const canEdit = onToggleDay && onAddTimeSlot && onRemoveTimeSlot;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            {isEditing ? "Configurar Agenda" : "Confirmar Agenda"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Configure seus horários de atendimento."
              : "Revise sua agenda antes de publicar."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Resumo */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="font-medium">
                {availableDays.length} dias
              </Badge>
              <Badge variant="secondary" className="font-medium">
                {totalSlots} horários
              </Badge>
            </div>
            {canEdit && !isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                Editar
              </Button>
            )}
          </div>

          {isEditing ? (
            <>
              {/* Modo de edição */}
              {schedules.length === 0 && onInitializeSchedule && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Você ainda não tem uma agenda configurada.
                  </p>
                  <Button onClick={handleInitialize} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Agenda Padrão
                  </Button>
                </div>
              )}

              {/* Lista de dias para edição */}
              <div className="space-y-3">
                {allDays.map((day) => (
                  <div
                    key={day.day_of_week}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium text-sm">
                        {dayNames[day.day_of_week]}
                      </Label>
                      <Switch
                        checked={day.is_available}
                        onCheckedChange={(checked) =>
                          handleToggleDay(day.day_of_week, checked)
                        }
                        disabled={isTogglingDay}
                      />
                    </div>

                    {day.is_available && (
                      <div className="space-y-2">
                        {/* Horários existentes */}
                        <div className="flex flex-wrap gap-1">
                          {day.time_slots.map((slot) => (
                            <Badge
                              key={slot.id}
                              variant="outline"
                              className="text-xs pr-1"
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              <button
                                onClick={() => handleRemoveSlot(slot.id)}
                                className="ml-1 p-0.5 hover:bg-destructive/20 rounded"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>

                        {/* Adicionar novo horário */}
                        {selectedDay === day.day_of_week ? (
                          <div className="flex items-center gap-2 mt-2">
                            <Select value={newStartTime} onValueChange={setNewStartTime}>
                              <SelectTrigger className="w-24 h-8 text-xs">
                                <SelectValue placeholder="Início" />
                              </SelectTrigger>
                              <SelectContent>
                                {timeOptions.map((time) => (
                                  <SelectItem key={time} value={time} className="text-xs">
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-xs text-muted-foreground">às</span>
                            <Select value={newEndTime} onValueChange={setNewEndTime}>
                              <SelectTrigger className="w-24 h-8 text-xs">
                                <SelectValue placeholder="Fim" />
                              </SelectTrigger>
                              <SelectContent>
                                {timeOptions.map((time) => (
                                  <SelectItem key={time} value={time} className="text-xs">
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              className="h-8"
                              onClick={handleAddSlot}
                              disabled={isAddingSlot || !newStartTime || !newEndTime || newStartTime >= newEndTime}
                            >
                              {isAddingSlot ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Plus className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8"
                              onClick={() => {
                                setSelectedDay(null);
                                setNewStartTime("");
                                setNewEndTime("");
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setSelectedDay(day.day_of_week)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Adicionar horário
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Modo visualização */}
              <div className="space-y-2">
                {availableDays.length > 0 ? (
                  availableDays.map((day) => (
                    <div
                      key={day.id}
                      className="flex items-start justify-between p-3 rounded-lg border bg-card"
                    >
                      <div>
                        <p className="font-medium text-sm">{dayNames[day.day_of_week]}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {day.time_slots.map((slot) => (
                            <Badge key={slot.id} variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <CalendarClock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum horário configurado.</p>
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => setIsEditing(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Configurar Agora
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                asChild
                className="w-full sm:w-auto"
              >
                <Link to="/agenda">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Agenda Completa
                </Link>
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                className="w-full sm:w-auto"
                disabled={availableDays.length === 0}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Continuar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button
                onClick={onConfirm}
                disabled={isSubmitting || availableDays.length === 0}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirmar e Publicar
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
