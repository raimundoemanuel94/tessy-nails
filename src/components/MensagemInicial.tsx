"use client"

import { useEffect, useState } from "react"

const mensagens = [
  {
    texto: "Confie no Senhor de todo o seu coração.",
    versiculo: "Provérbios 3:5"
  },
  {
    texto: "Tudo posso naquele que me fortalece.",
    versiculo: "Filipenses 4:13"
  },
  {
    texto: "O Senhor é meu pastor, nada me faltará.",
    versiculo: "Salmos 23:1"
  },
  {
    texto: "Não te deixes turbar, nem teu coração.",
    versiculo: "João 14:27"
  },
  {
    texto: "O Senhor é a minha luz e a minha salvação.",
    versiculo: "Salmos 27:1"
  },
  {
    texto: "Tudo quanto Deus faz durará eternamente.",
    versiculo: "Eclesiastes 3:14"
  },
  {
    texto: "A alegria do Senhor é a vossa força.",
    versiculo: "Neemias 8:10"
  },
  {
    texto: "O Senhor te abençoe e te guarde.",
    versiculo: "Números 6:24"
  }
]

export default function MensagemInicial() {
  const [mostrar, setMostrar] = useState(false)
  const [mensagem, setMensagem] = useState(mensagens[0])

  useEffect(() => {
    // Verifica se já mostrou hoje
    const hoje = new Date().toDateString()
    const ultima = localStorage.getItem("mensagem-dia")

    if (ultima !== hoje) {
      // Pega mensagem aleatória
      const random = mensagens[Math.floor(Math.random() * mensagens.length)]
      setMensagem(random)

      // Mostra ao abrir
      setMostrar(true)
      
      // Salva que mostrou hoje
      localStorage.setItem("mensagem-dia", hoje)

      // Some depois de 8s
      const timer = setTimeout(() => {
        setMostrar(false)
      }, 8000)

      return () => clearTimeout(timer)
    }
  }, [])

  if (!mostrar) return null

  return (
    <div className="fixed top-5 right-5 z-50 bg-white shadow-2xl rounded-3xl p-6 max-w-sm border border-violet-100 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-violet-600">Mensagem do dia ✨</p>
        <button
          onClick={() => setMostrar(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <p className="text-lg font-bold text-slate-900 mb-2 leading-relaxed">
        "{mensagem.texto}"
      </p>

      <p className="text-sm font-semibold text-violet-500">
        {mensagem.versiculo}
      </p>

      <button
        onClick={() => setMostrar(false)}
        className="mt-4 text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors"
      >
        Fechar
      </button>
    </div>
  )
}
