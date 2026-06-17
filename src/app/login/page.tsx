'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { getPostAuthRedirectPath } from '@/lib/auth/post-auth-redirect'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const sb = createClient()
    const { data, error: err } = await sb.auth.signInWithPassword({ email, password })
    if (err) { setError('Email ou senha incorretos.'); setLoading(false); return }
    const userId = data.user?.id ?? (await sb.auth.getUser()).data.user?.id
    const { data: profile } = userId
      ? await sb.from('profiles').select('role, studio_id').eq('id', userId).maybeSingle()
      : { data: null }

    router.replace(getPostAuthRedirectPath(profile))
    router.refresh()
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#080612', fontFamily:'"Plus Jakarta Sans",-apple-system,sans-serif', padding:16,
      backgroundImage:'radial-gradient(600px circle at 50% -100px, rgba(124,92,191,.22), transparent 70%)',
    }}>
      {/* Grain texture */}
      <div style={{ position:'fixed', inset:0, opacity:.025, pointerEvents:'none',
        backgroundImage:'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}/>

      <div style={{ width:'100%', maxWidth:400, display:'flex', flexDirection:'column', gap:28, position:'relative' }}>

        {/* Logo + brand */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
          <div style={{ width:64, height:64, borderRadius:20, background:'linear-gradient(140deg,#9D7FD4,#7C5CBF)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:30,
            boxShadow:'0 8px 30px rgba(124,92,191,.5), inset 0 1px 0 rgba(255,255,255,.25)' }}>
            💅
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'Georgia,serif', fontSize:28, fontWeight:600, color:'#fff', letterSpacing:'-.02em' }}>Nailit</div>
            <div style={{ fontSize:10, color:'#7C5CBF', fontWeight:700, letterSpacing:'.22em', marginTop:2 }}>STUDIO MANAGER</div>
          </div>
        </div>

        {/* Card */}
        <div style={{ position:'relative', background:'linear-gradient(180deg,#1A1530,#120F22)',
          border:'1px solid rgba(255,255,255,.07)', borderRadius:24, padding:28,
          boxShadow:'0 24px 60px rgba(0,0,0,.5)' }}>
          {/* top edge light */}
          <div style={{ position:'absolute', inset:0, borderRadius:24, padding:1,
            background:'linear-gradient(180deg,rgba(255,255,255,.12),transparent 40%)',
            WebkitMask:'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite:'xor', maskComposite:'exclude', pointerEvents:'none' }}/>

          <h2 style={{ fontFamily:'Georgia,serif', fontSize:22, fontWeight:600, color:'#fff', margin:'0 0 6px', letterSpacing:'-.01em' }}>Entrar na sua conta</h2>
          <p style={{ fontSize:12, color:'#736C8E', margin:'0 0 24px' }}>Gerencie seu studio com estilo ✨</p>

          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:10, color:'#736C8E', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="seu@email.com" autoComplete="email"
                style={{ height:46, padding:'0 15px', background:'#0D0A1A', border:'1px solid rgba(255,255,255,.12)',
                  borderRadius:13, color:'#F4F2FB', fontSize:14, fontFamily:'inherit', outline:'none',
                  transition:'.15s' }}
                onFocus={e => e.target.style.borderColor='#7C5CBF'}
                onBlur={e => e.target.style.borderColor='rgba(255,255,255,.12)'}/>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:10, color:'#736C8E', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase' }}>Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••" autoComplete="current-password"
                style={{ height:46, padding:'0 15px', background:'#0D0A1A', border:'1px solid rgba(255,255,255,.12)',
                  borderRadius:13, color:'#F4F2FB', fontSize:14, fontFamily:'inherit', outline:'none',
                  transition:'.15s' }}
                onFocus={e => e.target.style.borderColor='#7C5CBF'}
                onBlur={e => e.target.style.borderColor='rgba(255,255,255,.12)'}/>
            </div>

            {error && (
              <div style={{ background:'rgba(245,90,90,.1)', border:'1px solid rgba(245,90,90,.25)', borderRadius:10,
                padding:'10px 14px', fontSize:12, color:'#f55a5a', display:'flex', alignItems:'center', gap:8 }}>
                ⚠ {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ height:48, borderRadius:14, background:'linear-gradient(135deg,#9D7FD4,#7C5CBF)', color:'#fff',
                fontSize:14, fontWeight:700, border:'none', cursor:'pointer', fontFamily:'inherit', marginTop:6,
                boxShadow:'0 6px 22px rgba(124,92,191,.4), inset 0 1px 0 rgba(255,255,255,.2)',
                opacity:loading?0.7:1, transition:'.15s' }}>
              {loading ? 'Entrando...' : 'Entrar no studio'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign:'center', fontSize:11, color:'#736C8E' }}>
          Nailit SaaS · Feito com 💅 para manicures
        </div>
      </div>
    </div>
  )
}

