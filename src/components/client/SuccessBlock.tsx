"use client";

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
    <div className="text-center space-y-6">
      {/* Success Icon with Animation */}
      <div className="relative inline-block">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg">
          <CheckCircle className="h-12 w-12 text-white" />
        </div>
        
        {/* Sparkles Animation */}
        <div className="absolute -top-2 -right-2">
          <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
        </div>
        <div className="absolute -bottom-2 -left-2">
          <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
      </div>

      {/* Success Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
          {title}
        </h1>
        
        {subtitle && (
          <p className="text-lg text-pink-600 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {/* Security Message */}
      {message && (
        <div className="rounded-2xl bg-pink-50 p-6 max-w-md mx-auto">
          <p className="text-gray-700 leading-relaxed">
            {message}
          </p>
        </div>
      )}

      {/* Visual Separator */}
      <div className="flex items-center justify-center space-x-2">
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-pink-200 to-transparent" />
        <div className="h-2 w-2 rounded-full bg-pink-500" />
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-pink-200 to-transparent" />
      </div>
    </div>
  );
}
