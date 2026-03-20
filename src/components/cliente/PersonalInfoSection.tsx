"use client";

import { User, Mail, Phone, MapPin, Calendar, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  birthDate?: Date;
  observations?: string;
}

interface PersonalInfoSectionProps {
  info: PersonalInfo;
  onEdit?: () => void;
  showEditButton?: boolean;
}

export function PersonalInfoSection({ 
  info, 
  onEdit, 
  showEditButton = true 
}: PersonalInfoSectionProps) {
  const items = [
    { label: "Nome completo", value: info.fullName, icon: User },
    { label: "E-mail", value: info.email, icon: Mail },
    { label: "Telefone", value: info.phone, icon: Phone },
    { label: "Endereço", value: info.address, icon: MapPin },
    {
      label: "Data de nascimento",
      value: info.birthDate
        ? new Date(info.birthDate).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : undefined,
      icon: Calendar,
    },
  ].filter((item) => item.value);

  return (
    <div className="rounded-[30px] border border-violet-100/70 bg-white/95 p-5 shadow-sm shadow-violet-100/40">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-500">Informações</p>
          <h3 className="text-xl font-black tracking-tight text-slate-900">Detalhes pessoais</h3>
        </div>
        {showEditButton && onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="rounded-2xl border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            <Edit className="mr-1 h-4 w-4" />
            Editar
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-3 rounded-2xl bg-slate-50/80 px-4 py-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <item.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
              <p className="wrap-break-word text-sm font-semibold text-slate-800">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {info.observations && (
        <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
          <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-500">Observações</p>
          <p className="text-sm leading-6 text-slate-600">{info.observations}</p>
        </div>
      )}
    </div>
  );
}
