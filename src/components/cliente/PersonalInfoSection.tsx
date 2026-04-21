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
    <div className="rounded-[30px] border border-brand-accent/20 bg-white/95 p-5 shadow-premium">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-text-sub">Informações</p>
          <h3 className="text-xl font-serif font-bold tracking-tight text-brand-text-main">Detalhes pessoais</h3>
        </div>
        {showEditButton && onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="rounded-2xl border-brand-accent/30 text-brand-primary hover:bg-brand-soft/30"
          >
            <Edit className="mr-1 h-4 w-4" />
            Editar
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-3 rounded-2xl bg-brand-soft/20 px-4 py-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <item.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-text-sub">{item.label}</p>
              <p className="wrap-break-word text-sm font-semibold text-brand-text-main">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {info.observations && (
        <div className="mt-4 rounded-2xl border border-brand-accent/20 bg-brand-soft/20 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-text-sub">Observações</p>
          <p className="text-sm leading-6 text-brand-text-main">{info.observations}</p>
        </div>
      )}
    </div>
  );
}
