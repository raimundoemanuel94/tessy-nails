'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
const P='#a78bfa',PK='#f472b6',G='#34d399'
const NAV=[{href:'/dashboard',icon:'⊞',label:'Dashboard'},{href:'/agenda',icon:'◷',label:'Agenda'},{href:'/agendamentos',icon:'☰',label:'Agendamentos'},{href:'/clientes',icon:'◎',label:'Clientes'},{href:'/servicos',icon:'✦',label:'Serviços'},{href:'/relatorios',icon:'◈',label:'Relatórios'},{href:'/configuracoes',icon:'⚙',label:'Config'}]
export function Sidebar({profile}:{profile:any}){
  const path=usePathname()
  const nome=profile?.studios?.name||profile?.full_name||'Studio'
  const ini=nome.slice(0,2).toUpperCase()
  const plano=profile?.studios?.plan||'free'
  return(<>
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 z-50" style={{background:'#10101f',borderRight:'1px solid #1c1c36'}}>
      <div style={{padding:'18px 14px',borderBottom:'1px solid #1c1c36',display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${P},${PK})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>💅</div>
        <div><div style={{fontSize:15,fontWeight:800,color:'#fff'}}>Nailit</div><div style={{fontSize:9,color:P,fontFamily:'monospace',letterSpacing:'0.12em'}}>STUDIO MANAGER</div></div>
      </div>
      <nav style={{flex:1,padding:'10px 6px',display:'flex',flexDirection:'column',gap:2}}>
        {NAV.map(n=>{const a=path===n.href||(n.href!=='/dashboard'&&path.startsWith(n.href));return(
          <Link key={n.href} href={n.href} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,background:a?P+'18':'transparent',color:a?P:'#6b6b9a',fontWeight:a?600:400,fontSize:13,textDecoration:'none',borderLeft:a?`3px solid ${P}`:'3px solid transparent',transition:'all 0.15s'}}>
            <span style={{fontSize:15,width:20,textAlign:'center'}}>{n.icon}</span>{n.label}
          </Link>
        )})}
      </nav>
      <div style={{padding:'12px 14px',borderTop:'1px solid #1c1c36',display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:34,height:34,borderRadius:'50%',background:`linear-gradient(135deg,${PK},${P})`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#fff',fontSize:12,flexShrink:0}}>{ini}</div>
        <div>
          <div style={{fontSize:12,fontWeight:600,color:'#e8e8f8'}}>{nome}</div>
          <div style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:6,height:6,borderRadius:'50%',background:G,display:'inline-block'}}/><span style={{fontSize:10,color:'#6b6b9a'}}>Plano {plano}</span></div>
        </div>
      </div>
    </aside>
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex" style={{background:'#10101f',borderTop:'1px solid #1c1c36'}}>
      {NAV.map(n=>{const a=path===n.href||(n.href!=='/dashboard'&&path.startsWith(n.href));return(
        <Link key={n.href} href={n.href} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'8px 0 10px',color:a?P:'#6b6b9a',textDecoration:'none',fontSize:9,fontWeight:a?700:400}}>
          <span style={{fontSize:18}}>{n.icon}</span>{n.label.slice(0,5)}
        </Link>
      )})}
    </nav>
  </>)
}
