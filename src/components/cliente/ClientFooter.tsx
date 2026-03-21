"use client";

import { Phone, MapPin, Mail, Instagram } from "lucide-react";

export function ClientFooter() {
  return (
    <footer id="contato" className="bg-gray-900 text-white">
      <div className="container px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-linear-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <img src="/images/logo/logo-compact.svg" alt="Tessy Nails" className="h-10 w-auto opacity-70 grayscale contrast-200" />
            </div>
            <p className="mb-4 max-w-md text-gray-400">
              Transformando unhas com arte, cuidado e profissionalismo. 
              Sua beleza é nossa paixão.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-gray-400 hover:text-brand-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-violet-400 transition-colors"
                aria-label="WhatsApp"
              >
                <Phone className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 font-semibold">Contato</h3>
            <div className="space-y-3 text-gray-400">
              <div className="flex items-center">
                <Phone className="mr-2 h-4 w-4" />
                <span>(11) 98765-4321</span>
              </div>
              <div className="flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                <span>contato@tessynails.com.br</span>
              </div>
              <div className="flex items-start">
                <MapPin className="mr-2 h-4 w-4 mt-1" />
                <span>
                  Av. Paulista, 1234<br />
                  São Paulo - SP
                </span>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h3 className="mb-4 font-semibold">Horários</h3>
            <div className="space-y-1 text-sm text-gray-400">
              <div>Segunda a Sexta: 09h - 19h</div>
              <div>Sábado: 09h - 17h</div>
              <div>Domingo: Fechado</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          <p>
            © 2024 Tessy Nails. Todos os direitos reservados. 
            Desenvolvido com ❤️ em São Paulo.
          </p>
        </div>
      </div>
    </footer>
  );
}
