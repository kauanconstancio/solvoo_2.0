import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface OccupiedSlot {
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  end_time: string;
}

export function useOccupiedSlots(professionalId: string, startDate: Date, endDate: Date) {
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOccupiedSlots = async () => {
      if (!professionalId) return;

      try {
        setIsLoading(true);
        
        const startDateStr = format(startDate, 'yyyy-MM-dd');
        const endDateStr = format(endDate, 'yyyy-MM-dd');

        // Fetch appointments that are not cancelled
        const { data, error } = await supabase
          .from('appointments')
          .select('scheduled_date, scheduled_time, duration_minutes')
          .eq('professional_id', professionalId)
          .gte('scheduled_date', startDateStr)
          .lte('scheduled_date', endDateStr)
          .neq('status', 'cancelled');

        if (error) {
          console.error('Error fetching occupied slots:', error);
          return;
        }

        // Calculate end time for each appointment
        const slotsWithEndTime = (data || []).map(appointment => {
          const [hours, minutes] = appointment.scheduled_time.split(':').map(Number);
          const totalMinutes = hours * 60 + minutes + appointment.duration_minutes;
          const endHours = Math.floor(totalMinutes / 60);
          const endMins = totalMinutes % 60;
          const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}:00`;
          
          return {
            ...appointment,
            end_time: endTime
          };
        });

        setOccupiedSlots(slotsWithEndTime);
      } catch (error) {
        console.error('Error fetching occupied slots:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOccupiedSlots();
  }, [professionalId, startDate, endDate]);

  const isSlotOccupied = (date: Date, slotStartTime: string, slotEndTime: string): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    return occupiedSlots.some(occupied => {
      if (occupied.scheduled_date !== dateStr) return false;
      
      const occupiedStart = occupied.scheduled_time;
      const occupiedEnd = occupied.end_time;
      
      // Check for overlap
      // Slot conflicts if:
      // - slot starts during occupied time (slotStart >= occupiedStart && slotStart < occupiedEnd)
      // - slot ends during occupied time (slotEnd > occupiedStart && slotEnd <= occupiedEnd)
      // - slot completely contains occupied time (slotStart <= occupiedStart && slotEnd >= occupiedEnd)
      const slotStartsInOccupied = slotStartTime >= occupiedStart && slotStartTime < occupiedEnd;
      const slotEndsInOccupied = slotEndTime > occupiedStart && slotEndTime <= occupiedEnd;
      const slotContainsOccupied = slotStartTime <= occupiedStart && slotEndTime >= occupiedEnd;
      
      return slotStartsInOccupied || slotEndsInOccupied || slotContainsOccupied;
    });
  };

  const getOccupiedSlotsForDate = (date: Date): OccupiedSlot[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return occupiedSlots.filter(slot => slot.scheduled_date === dateStr);
  };

  return {
    occupiedSlots,
    isLoading,
    isSlotOccupied,
    getOccupiedSlotsForDate
  };
}
