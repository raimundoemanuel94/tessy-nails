"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppointmentSchema, Appointment, Client, Service, User, AppointmentStatusEnum, PaymentStatusEnum } from "@/types";
import { clientService, salonService, appointmentService, authService } from "@/services";
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
import { CalendarIcon, Loader2, Clock } from "lucide-react";
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

  useEffect(() => {
    async function loadData() {
      try {
        setFetching(true);
        const [loadedClients, loadedServices] = await Promise.all([
          clientService.getAll(),
          appointment ? salonService.getAllWithInactive() : salonService.getAll()
        ]);
        setClients(loadedClients || []);
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
        {/* Cliente */}
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-slate-50/50">
                    <SelectValue placeholder="Selecione uma cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.length > 0 ? (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id!}>
                        {client.name || `ID: ${client.id.slice(0, 8)}`}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      Nenhuma cliente cadastrada
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
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
                    <SelectValue placeholder="Selecione um serviço" />
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
