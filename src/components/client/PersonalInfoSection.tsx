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
  return (
    <div className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">
          Informações pessoais
        </h3>
        
        {showEditButton && onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="border-pink-200 text-pink-700 hover:bg-pink-50"
          >
            <Edit className="mr-1 h-4 w-4" />
            Editar
          </Button>
        )}
      </div>

      {/* Personal Information */}
      <div className="space-y-4">
        {/* Full Name */}
        <div className="flex items-start space-x-3">
          <User className="mt-1 h-4 w-4 text-pink-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Nome completo</p>
            <p className="text-gray-900">{info.fullName}</p>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-start space-x-3">
          <Mail className="mt-1 h-4 w-4 text-pink-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">E-mail</p>
            <p className="text-gray-900">{info.email}</p>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-start space-x-3">
          <Phone className="mt-1 h-4 w-4 text-pink-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Telefone</p>
            <p className="text-gray-900">{info.phone}</p>
          </div>
        </div>

        {/* Address */}
        {info.address && (
          <div className="flex items-start space-x-3">
            <MapPin className="mt-1 h-4 w-4 text-pink-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Endereço</p>
              <p className="text-gray-900">{info.address}</p>
            </div>
          </div>
        )}

        {/* Birth Date */}
        {info.birthDate && (
          <div className="flex items-start space-x-3">
            <Calendar className="mt-1 h-4 w-4 text-pink-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Data de nascimento</p>
              <p className="text-gray-900">
                {new Date(info.birthDate).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        )}

        {/* Observations */}
        {info.observations && (
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Observações</p>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-gray-700 text-sm">{info.observations}</p>
            </div>
          </div>
        )}
      </div>

      {/* Visual Separator */}
      <div className="mt-6 h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent" />

      {/* Privacy Note */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Suas informações são mantidas em segurança e usadas apenas para melhorar sua experiência.
        </p>
      </div>
    </div>
  );
}
