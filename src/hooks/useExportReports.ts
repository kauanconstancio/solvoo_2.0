import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ExportType = 'users' | 'services' | 'transactions' | 'reviews' | 'appointments';

export const useExportReports = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          let value = row[header];
          if (value === null || value === undefined) value = '';
          if (typeof value === 'string' && value.includes(',')) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Relatório exportado com sucesso!');
  };

  const exportUsers = async () => {
    try {
      setIsExporting(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, city, state, account_type, status, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map(user => ({
        ID: user.user_id,
        Nome: user.full_name || '',
        Telefone: user.phone || '',
        Cidade: user.city || '',
        Estado: user.state || '',
        Tipo: user.account_type === 'profissional' ? 'Profissional' : 'Cliente',
        Status: user.status,
        'Data Cadastro': format(new Date(user.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
      }));

      exportToCSV(formattedData, 'usuarios');
    } catch (err: any) {
      console.error('Error exporting users:', err);
      toast.error('Erro ao exportar usuários');
    } finally {
      setIsExporting(false);
    }
  };

  const exportServices = async () => {
    try {
      setIsExporting(true);
      const { data, error } = await supabase
        .from('services')
        .select(`
          id, title, category, subcategory, price, price_type, city, state, 
          status, views_count, favorites_count, verified, created_at,
          profiles:user_id (full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map(service => ({
        ID: service.id,
        Titulo: service.title,
        Categoria: service.category,
        Subcategoria: service.subcategory || '',
        Preco: service.price,
        'Tipo Preco': service.price_type,
        Cidade: service.city,
        Estado: service.state,
        Status: service.status,
        Visualizacoes: service.views_count,
        Favoritos: service.favorites_count,
        Verificado: service.verified ? 'Sim' : 'Não',
        Profissional: (service.profiles as any)?.full_name || '',
        'Data Criacao': format(new Date(service.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
      }));

      exportToCSV(formattedData, 'servicos');
    } catch (err: any) {
      console.error('Error exporting services:', err);
      toast.error('Erro ao exportar serviços');
    } finally {
      setIsExporting(false);
    }
  };

  const exportTransactions = async () => {
    try {
      setIsExporting(true);
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map(tx => ({
        ID: tx.id,
        'Usuario ID': tx.user_id,
        Tipo: tx.type === 'credit' ? 'Crédito' : 'Débito',
        Valor: tx.amount,
        Taxa: tx.fee,
        'Valor Liquido': tx.net_amount,
        Status: tx.status,
        Descricao: tx.description,
        'Data': format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
      }));

      exportToCSV(formattedData, 'transacoes');
    } catch (err: any) {
      console.error('Error exporting transactions:', err);
      toast.error('Erro ao exportar transações');
    } finally {
      setIsExporting(false);
    }
  };

  const exportReviews = async () => {
    try {
      setIsExporting(true);
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id, rating, comment, response_text, created_at,
          services:service_id (title),
          profiles:user_id (full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map(review => ({
        ID: review.id,
        Servico: (review.services as any)?.title || '',
        Usuario: (review.profiles as any)?.full_name || '',
        Nota: review.rating,
        Comentario: review.comment || '',
        Resposta: review.response_text || '',
        'Data': format(new Date(review.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
      }));

      exportToCSV(formattedData, 'avaliacoes');
    } catch (err: any) {
      console.error('Error exporting reviews:', err);
      toast.error('Erro ao exportar avaliações');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAppointments = async () => {
    try {
      setIsExporting(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('scheduled_date', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map(apt => ({
        ID: apt.id,
        Titulo: apt.title,
        Data: apt.scheduled_date,
        Hora: apt.scheduled_time,
        Duracao: `${apt.duration_minutes} min`,
        Status: apt.status,
        Local: apt.location || '',
        'Cliente Confirmou': apt.client_confirmed ? 'Sim' : 'Não',
        'Profissional Confirmou': apt.professional_confirmed ? 'Sim' : 'Não',
        'Criado Em': format(new Date(apt.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
      }));

      exportToCSV(formattedData, 'agendamentos');
    } catch (err: any) {
      console.error('Error exporting appointments:', err);
      toast.error('Erro ao exportar agendamentos');
    } finally {
      setIsExporting(false);
    }
  };

  const exportReport = async (type: ExportType) => {
    switch (type) {
      case 'users':
        return exportUsers();
      case 'services':
        return exportServices();
      case 'transactions':
        return exportTransactions();
      case 'reviews':
        return exportReviews();
      case 'appointments':
        return exportAppointments();
    }
  };

  return {
    isExporting,
    exportReport,
    exportUsers,
    exportServices,
    exportTransactions,
    exportReviews,
    exportAppointments
  };
};
