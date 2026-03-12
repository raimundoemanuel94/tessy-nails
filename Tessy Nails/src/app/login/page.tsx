"use client";

import { useState, useEffect } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn, user } = useAuth();

  // Role-based redirect effect
  useEffect(() => {
    if (user) {
      if (user.role === 'admin' || user.role === 'professional') {
        router.push("/admin/dashboard");
      } else if (user.role === 'client') {
        router.push("/");
      }
    }
  }, [user, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Attempting login with:', { email, password });
      const success = await signIn(email, password);
      console.log('Login result:', success);
      if (success) {
        toast.success("Login realizado com sucesso!");
        // Redirect will be handled by useEffect based on user role
      } else {
        toast.error("Login falhou. Verifique suas credenciais.");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error("Erro ao fazer login: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      if (auth) {
        await signInWithPopup(auth, provider);
        toast.success("Login com Google realizado!");
        // Redirect will be handled by useEffect based on user role
      }
    } catch (error: any) {
      toast.error("Erro ao fazer login com Google: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Tessy Nails</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar o painel
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleEmailLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="exemplo@tessynails.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Button variant="link" className="px-0 font-normal text-xs">
                  Esqueceu a senha?
                </Button>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Entrar"}
            </Button>
          </CardContent>
        </form>
        <div className="relative px-6 pb-4">
          <div className="absolute inset-0 flex items-center px-6">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
          </div>
        </div>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={loading}>
            Google
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
