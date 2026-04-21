"use client";

import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clientService } from "@/services/clients";
import { Client } from "@/types";
import { toast } from "sonner";
import { Loader2, User, Phone, Mail, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Helper functions for normalization
const normalizeName = (name: string): string => {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map(word => {
      if (word.length === 0) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};

const sanitizePhone = (phone: string): string => {
  return phone.replace(/\D/g, "");
};

const formatPhoneDisplay = (value: string) => {
  const nums = value.replace(/\D/g, "");
  if (nums.length <= 2) return nums;
  if (nums.length <= 6) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
  if (nums.length <= 10) return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`;
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7, 11)}`;
};

const clientFormSchema = z.object({
  name: z.string()
    .min(1, "O nome é obrigatório")
    .transform(v => normalizeName(v))
    .refine(v => v.replace(/\s/g, "").length >= 2, "O nome deve conter pelo menos 2 letras"),
  email: z.string()
    .email("Informe um e-mail válido")
    .optional()
    .or(z.literal("")),
  phone: z.string()
    .min(1, "O telefone é obrigatório")
    .refine(v => {
      const digits = sanitizePhone(v);
      return digits.length === 10 || digits.length === 11;
    }, "Informe um telefone válido (10 ou 11 dígitos)"),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  client?: Client | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ClientForm({ client, onSuccess, onCancel }: ClientFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: client?.name || "",
      email: client?.email || "",
      phone: client?.phone ? formatPhoneDisplay(client.phone) : "",
      notes: client?.notes || "",
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    setLoading(true);
    try {
      const sanitizedData = {
        ...data,
        name: normalizeName(data.name),
        phone: sanitizePhone(data.phone),
        email: data.email || null, // Ensure empty string becomes null for Firebase consistency
      };

      // Check for duplicate phone (only if it's a new client or the phone has changed)
      const currentPhone = client?.phone ? sanitizePhone(client.phone) : "";
      if (!client?.id || sanitizedData.phone !== currentPhone) {
        const existing = await clientService.getByPhone(sanitizedData.phone);
        if (existing) {
          toast.error("Já existe um cliente com este telefone", {
            icon: <AlertCircle className="w-5 h-5 text-red-500" />,
            className: "bg-red-50 border-red-100 font-bold",
          });
          setLoading(false);
          return;
        }
      }

      if (client?.id) {
        await clientService.update(client.id, sanitizedData as any);
        toast.success("Cliente atualizado com sucesso!", {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        });
      } else {
        await clientService.create({
          ...sanitizedData,
          totalAppointments: 0,
          isActive: true,
        } as any);
        toast.success("Cliente cadastrado com sucesso!", {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        });
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Ocorreu um erro ao salvar os dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Nome Field */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
          Nome Completo
        </Label>
        <div className="relative group">
          <User className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200",
            errors.name ? "text-red-400" : "text-slate-400 group-focus-within:text-brand-primary"
          )} size={18} />
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="name"
                placeholder="Ex: Maria Silva"
                className={cn(
                  "pl-12 h-13 rounded-2xl border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 focus:ring-4 transition-all font-bold text-sm",
                  errors.name 
                    ? "border-red-200 focus:ring-red-500/10 focus:border-red-500 text-red-900 dark:text-red-400" 
                    : "focus:ring-brand-primary/10 focus:border-brand-primary"
                )}
                disabled={loading}
              />
            )}
          />
        </div>
        {errors.name && (
          <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 ml-1">
            <AlertCircle size={10} /> {errors.name.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Telefone Field */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
            Telefone / WhatsApp
          </Label>
          <div className="relative group">
            <Phone className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200",
              errors.phone ? "text-red-400" : "text-slate-400 group-focus-within:text-brand-primary"
            )} size={18} />
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="phone"
                  placeholder="(00) 00000-0000"
                  className={cn(
                    "pl-12 h-13 rounded-2xl border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 focus:ring-4 transition-all font-bold text-sm",
                    errors.phone 
                      ? "border-red-200 focus:ring-red-500/10 focus:border-red-500 text-red-900 dark:text-red-400" 
                      : "focus:ring-brand-primary/10 focus:border-brand-primary"
                  )}
                  onChange={(e) => {
                    const formatted = formatPhoneDisplay(e.target.value);
                    field.onChange(formatted);
                  }}
                  disabled={loading}
                />
              )}
            />
          </div>
          {errors.phone && (
            <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 ml-1">
              <AlertCircle size={10} /> {errors.phone.message}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
            E-mail (Opcional)
          </Label>
          <div className="relative group">
            <Mail className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200",
              errors.email ? "text-red-400" : "text-slate-400 group-focus-within:text-brand-primary"
            )} size={18} />
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="email"
                  type="email"
                  placeholder="maria@exemplo.com"
                  className={cn(
                    "pl-12 h-13 rounded-2xl border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 focus:ring-4 transition-all font-bold text-sm",
                    errors.email 
                      ? "border-red-200 focus:ring-red-500/10 focus:border-red-500 text-red-900 dark:text-red-400" 
                      : "focus:ring-brand-primary/10 focus:border-brand-primary"
                  )}
                  disabled={loading}
                />
              )}
            />
          </div>
          {errors.email && (
            <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 ml-1">
              <AlertCircle size={10} /> {errors.email.message}
            </p>
          )}
        </div>
      </div>

      {/* Observações Field */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
          Observações
        </Label>
        <div className="relative group">
          <FileText className="absolute left-4 top-4 text-slate-400 group-focus-within:text-brand-primary transition-colors duration-200" size={18} />
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                id="notes"
                placeholder="Ex: Alérgica a esmaltes com formol, prefere atendimento rápido..."
                className="pl-12 pt-3 h-32 rounded-2xl border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all font-bold text-sm resize-none"
                disabled={loading}
              />
            )}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onCancel} 
          disabled={loading}
          className="h-12 rounded-xl font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
          className="h-12 px-8 rounded-xl bg-brand-primary hover:opacity-90 text-white font-black shadow-lg shadow-brand-primary/20 transition-all hover:-translate-y-0.5"
        >
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-5 w-5" />
          )}
          {client ? "Salvar Alterações" : "Concluir Cadastro"}
        </Button>
      </div>
    </form>
  );
}
