"use client";

import { motion } from "framer-motion";
import { CheckCircle, Sparkles } from "lucide-react";

interface SuccessBlockProps {
  title?: string;
  subtitle?: string;
  message?: string;
}

export function SuccessBlock({ 
  title = "Agendamento confirmado!",
  subtitle,
  message 
}: SuccessBlockProps) {
  return (
    <div className="text-center space-y-4">
      {/* Success Icon with Animation */}
      <div className="relative inline-block mb-4">
        <motion.div 
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
          className="h-28 w-28 rounded-full bg-linear-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-2xl shadow-brand-primary/30"
        >
          <CheckCircle className="h-14 w-14 text-white" strokeWidth={2.5} />
        </motion.div>
        
        {/* Sparkles Animation */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-4 -right-4 text-brand-accent"
        >
          <Sparkles size={32} />
        </motion.div>
      </div>

      {/* Success Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-brand-text tracking-tighter uppercase leading-none">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.3em]">
            {subtitle}
          </p>
        )}
      </div>

      {/* Security Message */}
      {message && (
        <div className="max-w-xs mx-auto pt-2">
          <p className="text-xs font-semibold text-brand-text-muted leading-relaxed uppercase tracking-wider opacity-80">
            {message}
          </p>
        </div>
      )}
    </div>
  );
}
