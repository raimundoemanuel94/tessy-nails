"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppointmentSchema, Appointment, Client, Service, User, AppointmentStatusEnum, PaymentStatusEnum } from "@/types";
import { clientService, appointmentService } from "@/services";
import { globalStore } from "@/store/globalStore";
import { notificationService } from "@/services/notifications";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2, Clock, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface AppointmentFormProps {
  onSuccess: () => void;
  initialDate?: Date;
  appointment?: Appointment | null;
}

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00"
];

// Schema específico para o formulário que inclui o campo de horário
const formSchema = z.object({
  clientId: z.string().min(1, "Selecione uma cliente"),
  serviceId: z.string().min(1, "Selecione um serviço"),
  specialistId: z.string().min(1, "Selecione uma profissional"),
  appointmentDate: z.date(),
  time: z.string().min(1, "Selecione um horário"),
  status: AppointmentStatusEnum,
  paymentStatus: PaymentStatusEnum,
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AppointmentForm({ onSuccess, initialDate, appointment }: AppointmentFormProps) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Estados para busca Debounced de Clientes
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [clientsPopoverOpen, setClientsPopoverOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: appointment?.clientId || "",
      serviceId: appointment?.serviceId || "",
      specialistId: appointment?.specialistId || user?.uid || "",
      status: appointment?.status || "pending",
      paymentStatus: appointment?.paymentStatus || "unpaid",
      appointmentDate: appointment ? new Date(appointment.appointmentDate) : (initialDate || new Date()),
      time: appointment ? format(new Date(appointment.appointmentDate), "HH:mm") : "09:00",
      notes: appointment?.notes || "",
    },
  });

  const selectedClient = clients.find((client) => client.id === form.watch("clientId"));
  const selectedService = services.find((service) => service.id === form.watch("serviceId"));

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Client Search Effect
  useEffect(() => {
    async function searchClients() {
      if (debouncedSearch.length < 2) {
        // Se a busca for vazia, usamos o cache rápido do globalStore
        const recent = await globalStore.fetchRecentClients(false);
        setClients(recent);
        return;
      }
      
      try {
        setIsSearchingClient(true);
        const results = await clientService.searchByName(debouncedSearch, 10);
        
        // Mantém o cliente selecionado na lista mesmo que a busca o exclua
        setClients((prev) => {
          const currentVal = form.getValues("clientId");
          const hasSelectedClient = results.find(c => c.id === currentVal);
          const selectedInPrev = prev.find(c => c.id === currentVal);
          
          if (currentVal && !hasSelectedClient && selectedInPrev) {
            return [selectedInPrev, ...results];
          }
          return results;
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingClient(false);
      }
    }
    
    // Só disparar se não for a carga inicial (que é tratada no loadData)
    if (!fetching) {
      searchClients();
    }
  }, [debouncedSearch, fetching, form]);

  // Initial Load (Serviços e Cliente Atual)
  useEffect(() => {
    async function loadData() {
      try {
        setFetching(true);
        // ✅ OTIMIZAÇÃO: Usa o cache do in-memory store invés de getAll() no Firebase
        const [recentClients, loadedServices] = await Promise.all([
          globalStore.fetchRecentClients(false),
          globalStore.fetchServices(false)
        ]);
        
        // Garante que o cliente do agendamento editado está na lista
        let finalClients = recentClients || [];
        if (appointment && appointment.clientId) {
          const existing = finalClients.find(c => c.id === appointment.clientId);
          if (!existing) {
            const specificClient = await clientService.getById(appointment.clientId);
            if (specificClient) finalClients = [specificClient, ...finalClients];
          }
        }
        
        setClients(finalClients);
        setServices(loadedServices || []);
      } catch (error) {
        console.error("Erro ao carregar dados do formulário:", error);
        toast.error("Erro ao carregar dados do formulário");
      } finally {
        setFetching(false);
      }
    }
    loadData();
  }, [appointment]);

  async function onSubmit(data: any) {
    setLoading(true);
    try {
      // Combina a data selecionada com o horário selecionado
      const appointmentDate = new Date(data.appointmentDate);
      const [hours, minutes] = data.time.split(":").map(Number);
      appointmentDate.setHours(hours, minutes, 0, 0);

      // Remove o campo 'time' que é apenas para a UI e não existe no AppointmentSchema
      const { time, ...appointmentData } = data;

      if (appointment?.id) {
        await appointmentService.update(appointment.id, {
          ...appointmentData,
          appointmentDate,
        });
        toast.success("Agendamento atualizado com sucesso!");
      } else {
        await appointmentService.create({
          ...appointmentData,
          appointmentDate,
        });
        
        try {
          await notificationService.notifyNewAppointment({
            clientName: selectedClient?.name || 'Cliente',
            serviceName: selectedService?.name || 'Serviço'
          });
          
          await notificationService.notifyAppointmentConfirmed(
            appointmentData.clientId,
            { serviceName: selectedService?.name || 'Serviço' }
          );
        } catch (notifErr) {
          console.error("Notificação falhou, mas agendamento foi salvo:", notifErr);
        }
        
        toast.success("Agendamento criado com sucesso!");
      }
      onSuccess();
    } catch (error: any) {
      toast.error("Erro ao criar agendamento: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Cliente com Busca Inteligente */}
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Cliente</FormLabel>
              <Popover open={clientsPopoverOpen} onOpenChange={setClientsPopoverOpen}>
                <FormControl>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between h-11 rounded-xl border-slate-200 bg-slate-50/50",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value && selectedClient
                          ? selectedClient.name
                          : "Selecione ou busque uma cliente"}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    }
                  />
                </FormControl>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <div className="flex items-center border-b border-slate-100 px-3 py-2 bg-slate-50/50">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-slate-500" />
                    <Input 
                      placeholder="Buscar por nome..." 
                      className="border-0 focus-visible:ring-0 shadow-none h-8 px-0 bg-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {isSearchingClient && <Loader2 className="h-4 w-4 animate-spin opacity-50 ml-2" />}
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-1">
                    {clients.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500 font-medium">
                        {searchQuery.length > 0 ? "Nenhuma cliente encontrada." : "Digite para buscar."}
                      </div>
                    ) : (
                      clients.map((client) => (
                        <div
                          key={client.id}
                          className={cn(
                            "relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-brand-primary/10 hover:text-brand-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                            field.value === client.id ? "bg-brand-primary/10 text-brand-primary font-bold" : "text-slate-700"
                          )}
                          onClick={() => {
                            form.setValue("clientId", client.id!);
                            setClientsPopoverOpen(false);
                            setSearchQuery("");
                          }}
                        >
                          {client.name || `ID: ${client.id?.slice(0, 8)}`}
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Serviço */}
        <FormField
          control={form.control}
          name="serviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serviço</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-slate-50/50">
                    <SelectValue placeholder="Selecione um serviço">
                      {selectedService
                        ? `${selectedService.name} - R$ ${selectedService.price?.toFixed(2) || "0.00"}`
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {services.length > 0 ? (
                    services.map((service) => (
                      <SelectItem key={service.id} value={service.id!}>
                        {(service.name || "Sem Nome") + " - R$ " + (service.price?.toFixed(2) || "0.00")}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      Nenhum serviço disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Data */}
          <FormField
            control={form.control}
            name="appointmentDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data</FormLabel>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    }
                  />
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Horário (Campo extra para a UI, processado no onSubmit) */}
          <FormField
            control={form.control}
            name="time"
            defaultValue="09:00"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Horário" />
                      <Clock className="ml-auto h-4 w-4 opacity-50" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status do Agendamento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-slate-50/50">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="no_show">Não Compareceu</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Pagamento */}
          <FormField
            control={form.control}
            name="paymentStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status de Pagamento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-slate-50/50">
                      <SelectValue placeholder="Pagamento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="unpaid">Não Pago</SelectItem>
                    <SelectItem value="deposit_paid">Sinal Pago</SelectItem>
                    <SelectItem value="fully_paid">Totalmente Pago</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Observações */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Ex: Cliente alérgica a esmalte X, quer decoração específica..." 
                  className="resize-none"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={loading} className="w-full md:w-auto">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {appointment ? "Salvar Alterações" : "Confirmar Agendamento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
