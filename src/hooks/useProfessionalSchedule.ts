import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TimeSlot {
  id: string;
  schedule_id: string;
  start_time: string;
  end_time: string;
}

interface DaySchedule {
  id: string;
  user_id: string;
  day_of_week: number;
  is_available: boolean;
  time_slots: TimeSlot[];
}

interface ScheduleBlock {
  id: string;
  user_id: string;
  block_date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

export function useProfessionalSchedule(userId?: string) {
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      
      // Fetch schedules with time slots
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('professional_schedules')
        .select('*')
        .eq('user_id', userId)
        .order('day_of_week');

      if (schedulesError) throw schedulesError;

      // Fetch time slots for each schedule
      const schedulesWithSlots: DaySchedule[] = [];
      
      for (const schedule of schedulesData || []) {
        const { data: slotsData } = await supabase
          .from('schedule_time_slots')
          .select('*')
          .eq('schedule_id', schedule.id)
          .order('start_time');

        schedulesWithSlots.push({
          ...schedule,
          time_slots: slotsData || []
        });
      }

      setSchedules(schedulesWithSlots);

      // Fetch blocks
      const { data: blocksData, error: blocksError } = await supabase
        .from('schedule_blocks')
        .select('*')
        .eq('user_id', userId)
        .gte('block_date', new Date().toISOString().split('T')[0])
        .order('block_date');

      if (blocksError) throw blocksError;
      setBlocks(blocksData || []);

    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Erro ao carregar agenda');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const initializeSchedule = async () => {
    if (!userId) return;

    try {
      // Create default schedules for all days of the week
      const daysToCreate = [];
      for (let day = 0; day <= 6; day++) {
        const exists = schedules.find(s => s.day_of_week === day);
        if (!exists) {
          daysToCreate.push({
            user_id: userId,
            day_of_week: day,
            is_available: day >= 1 && day <= 5 // Monday to Friday available by default
          });
        }
      }

      if (daysToCreate.length > 0) {
        const { error } = await supabase
          .from('professional_schedules')
          .insert(daysToCreate);

        if (error) throw error;
        await fetchSchedules();
      }
    } catch (error) {
      console.error('Error initializing schedule:', error);
    }
  };

  const toggleDayAvailability = async (dayOfWeek: number, isAvailable: boolean) => {
    if (!userId) return;

    try {
      const existingSchedule = schedules.find(s => s.day_of_week === dayOfWeek);

      if (existingSchedule) {
        const { error } = await supabase
          .from('professional_schedules')
          .update({ is_available: isAvailable })
          .eq('id', existingSchedule.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('professional_schedules')
          .insert({
            user_id: userId,
            day_of_week: dayOfWeek,
            is_available: isAvailable
          });

        if (error) throw error;
      }

      await fetchSchedules();
      toast.success('Disponibilidade atualizada');
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('Erro ao atualizar disponibilidade');
    }
  };

  const addTimeSlot = async (dayOfWeek: number, startTime: string, endTime: string) => {
    if (!userId) return;

    try {
      let schedule = schedules.find(s => s.day_of_week === dayOfWeek);

      // Create schedule if doesn't exist
      if (!schedule) {
        const { data, error } = await supabase
          .from('professional_schedules')
          .insert({
            user_id: userId,
            day_of_week: dayOfWeek,
            is_available: true
          })
          .select()
          .single();

        if (error) throw error;
        schedule = { ...data, time_slots: [] };
      }

      // Add time slot
      const { error } = await supabase
        .from('schedule_time_slots')
        .insert({
          schedule_id: schedule.id,
          start_time: startTime,
          end_time: endTime
        });

      if (error) throw error;
      await fetchSchedules();
      toast.success('Horário adicionado');
    } catch (error) {
      console.error('Error adding time slot:', error);
      toast.error('Erro ao adicionar horário');
    }
  };

  const removeTimeSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('schedule_time_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;
      await fetchSchedules();
      toast.success('Horário removido');
    } catch (error) {
      console.error('Error removing time slot:', error);
      toast.error('Erro ao remover horário');
    }
  };

  const addBlock = async (blockDate: string, startTime?: string, endTime?: string, reason?: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('schedule_blocks')
        .insert({
          user_id: userId,
          block_date: blockDate,
          start_time: startTime || null,
          end_time: endTime || null,
          reason: reason || null
        });

      if (error) throw error;
      await fetchSchedules();
      toast.success('Bloqueio adicionado');
    } catch (error) {
      console.error('Error adding block:', error);
      toast.error('Erro ao adicionar bloqueio');
    }
  };

  const removeBlock = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from('schedule_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;
      await fetchSchedules();
      toast.success('Bloqueio removido');
    } catch (error) {
      console.error('Error removing block:', error);
      toast.error('Erro ao remover bloqueio');
    }
  };

  const getAvailableSlotsForDate = (date: Date): TimeSlot[] => {
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if day is blocked entirely
    const dayBlock = blocks.find(b => 
      b.block_date === dateStr && !b.start_time && !b.end_time
    );
    if (dayBlock) return [];

    // Get schedule for this day
    const schedule = schedules.find(s => s.day_of_week === dayOfWeek);
    if (!schedule || !schedule.is_available) return [];

    // Filter out blocked time slots
    const blockedSlots = blocks.filter(b => 
      b.block_date === dateStr && b.start_time && b.end_time
    );

    return schedule.time_slots.filter(slot => {
      return !blockedSlots.some(block => 
        (slot.start_time >= block.start_time! && slot.start_time < block.end_time!) ||
        (slot.end_time > block.start_time! && slot.end_time <= block.end_time!)
      );
    });
  };

  return {
    schedules,
    blocks,
    isLoading,
    initializeSchedule,
    toggleDayAvailability,
    addTimeSlot,
    removeTimeSlot,
    addBlock,
    removeBlock,
    getAvailableSlotsForDate,
    refetch: fetchSchedules
  };
}
