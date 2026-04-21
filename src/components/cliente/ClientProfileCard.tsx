"use client";

import { User, Mail, Phone, Shield, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ensureDate } from "@/lib/utils";

export interface ClientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  status?: 'active' | 'inactive' | 'pending';
  createdAt: Date;
}

interface ClientProfileCardProps {
  client: ClientData;
  onEditProfile?: () => void;
  showEditButton?: boolean;
}

export function ClientProfileCard({
  client,
  onEditProfile,
  showEditButton = true
}: ClientProfileCardProps) {
  const getStatusConfig = (status?: string) => {
    switch (status) {
      case "inactive":
        return { label: "Inativa", className: "bg-slate-100 text-slate-600" };
      case "pending":
        return { label: "Pendente", className: "bg-amber-50 text-amber-700" };
      default:
        return { label: "Ativa", className: "bg-emerald-50 text-emerald-700" };
    }
  };

  const statusConfig = getStatusConfig(client.status);

  return (
    <div className="overflow-hidden rounded-[30px] border border-brand-accent/20 bg-white/95 p-5 shadow-premium">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-text-sub">Perfil</p>
          <h3 className="text-xl font-serif font-bold tracking-tight text-brand-text-main">Seus dados principais</h3>
        </div>
        {showEditButton && onEditProfile && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEditProfile}
            className="rounded-2xl border-brand-accent/30 text-brand-primary hover:bg-brand-soft/30"
          >
            Editar perfil
          </Button>
        )}
      </div>

      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-linear-to-br from-brand-primary to-brand-secondary text-white shadow-premium">
            {client.avatar ? (
              <img
                src={client.avatar}
                alt={client.name}
                className="h-full w-full rounded-[26px] object-cover"
              />
            ) : (
              <User className="h-9 w-9 text-white" />
            )}
          </div>
          <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white text-brand-primary shadow-md">
            <Camera className="h-4 w-4" />
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2 text-xl font-bold tracking-tight text-brand-text-main leading-snug">{client.name}</h4>
          <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.className}`}>
            <Shield className="h-3.5 w-3.5" />
            Conta {statusConfig.label}
          </div>

          <div className="mt-4 space-y-2 text-sm text-brand-text-sub">
            <div className="flex items-center gap-2">
              <Mail className="mr-2 h-4 w-4 text-brand-primary" />
              <span className="truncate">{client.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="mr-2 h-4 w-4 text-brand-primary" />
              <span>{client.phone}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-brand-soft/30 px-4 py-3 text-sm text-brand-text-sub">
        Membro desde{" "}
        <span className="font-semibold text-brand-text-main">
          {ensureDate(client.createdAt).toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric'
          })}
        </span>
      </div>
    </div>
  );
}
