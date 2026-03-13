"use client";

import { User, Mail, Phone, Shield, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      case 'active':
        return {
          label: 'Ativa',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-200'
        };
      case 'inactive':
        return {
          label: 'Inativa',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200'
        };
      case 'pending':
        return {
          label: 'Pendente',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200'
        };
      default:
        return {
          label: 'Ativa',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-200'
        };
    }
  };

  const statusConfig = getStatusConfig(client.status);

  return (
    <div className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">
          Meus dados
        </h3>
        
        {showEditButton && onEditProfile && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEditProfile}
            className="border-pink-200 text-pink-700 hover:bg-pink-50"
          >
            Editar perfil
          </Button>
        )}
      </div>

      {/* Profile Info */}
      <div className="flex flex-col items-center space-y-4 sm:flex-row sm:items-start sm:space-y-0 sm:space-x-6">
        {/* Avatar */}
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow-lg">
            {client.avatar ? (
              <img 
                src={client.avatar} 
                alt={client.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-white" />
            )}
          </div>
          
          {/* Avatar Upload Button */}
          <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-pink-500 text-white flex items-center justify-center border-2 border-white shadow-md hover:bg-pink-600 transition-colors">
            <Camera className="h-4 w-4" />
          </button>
        </div>

        {/* User Info */}
        <div className="flex-1 text-center sm:text-left">
          <h4 className="text-xl font-semibold text-gray-900 mb-2">
            {client.name}
          </h4>
          
          {/* Status Badge */}
          <div className={`
            inline-flex items-center rounded-full px-3 py-1 text-xs font-medium mb-4
            ${statusConfig.bgColor} ${statusConfig.textColor}
          `}>
            <Shield className="mr-1 h-3 w-3" />
            Conta {statusConfig.label}
          </div>

          {/* Contact Info */}
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-center sm:justify-start">
              <Mail className="mr-2 h-4 w-4 text-pink-600" />
              <span>{client.email}</span>
            </div>
            
            <div className="flex items-center justify-center sm:justify-start">
              <Phone className="mr-2 h-4 w-4 text-pink-600" />
              <span>{client.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Separator */}
      <div className="mt-6 h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent" />

      {/* Additional Info */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Membro desde {client.createdAt.toLocaleDateString('pt-BR', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </p>
      </div>
    </div>
  );
}
