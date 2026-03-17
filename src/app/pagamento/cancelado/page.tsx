import { XCircle, RefreshCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PagamentoCanceladoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-red-50 to-white px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-red-100">
        <div className="bg-rose-500 p-8 text-center text-white">
          <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <XCircle size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Pagamento Cancelado</h1>
          <p className="text-rose-100">O processo de pagamento não foi concluído.</p>
        </div>
        
        <div className="p-8 space-y-6">
          <p className="text-gray-600 text-center">
            Nenhuma cobrança foi realizada no seu cartão e sua reserva ainda não está confirmada.
          </p>

          <div className="pt-2 space-y-3">
            <Link href="/cliente/agendamentos" passHref>
              <Button className="w-full bg-rose-500 hover:bg-rose-600 h-12 rounded-xl text-md font-semibold">
                <RefreshCcw className="mr-2 w-4 h-4" />
                Tentar Pagamento Novamente
              </Button>
            </Link>
            
            <Link href="/" passHref>
              <Button variant="outline" className="w-full h-12 rounded-xl text-md font-semibold text-gray-600 border-gray-200">
                <ArrowLeft className="mr-2 w-4 h-4" />
                Voltar ao Início
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
