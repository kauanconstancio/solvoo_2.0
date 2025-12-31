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
import { CalendarClock, CheckCircle2, Edit, Clock } from "lucide-react";

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
}

const dayNames = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const formatTime = (time: string) => {
  return time.slice(0, 5);
};

export function ScheduleConfirmationDialog({
  open,
  onClose,
  onConfirm,
  schedules,
  isSubmitting,
}: ScheduleConfirmationDialogProps) {
  const availableDays = schedules.filter((s) => s.is_available && s.time_slots.length > 0);
  const totalSlots = availableDays.reduce((acc, day) => acc + day.time_slots.length, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            Confirmar Agenda
          </DialogTitle>
          <DialogDescription>
            Revise sua agenda de atendimento antes de publicar o anúncio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Resumo */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-medium">
                {availableDays.length} dias
              </Badge>
              <span className="text-sm text-muted-foreground">disponíveis</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-medium">
                {totalSlots} horários
              </Badge>
              <span className="text-sm text-muted-foreground">configurados</span>
            </div>
          </div>

          {/* Lista de dias */}
          <div className="max-h-[200px] overflow-y-auto space-y-2">
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
              <div className="text-center py-4 text-muted-foreground text-sm">
                Nenhum horário configurado.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link to="/agenda">
              <Edit className="w-4 h-4 mr-2" />
              Editar Agenda
            </Link>
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting || availableDays.length === 0}
            className="w-full sm:w-auto"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {isSubmitting ? "Publicando..." : "Confirmar e Publicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
