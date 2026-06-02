"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getDocs, collection, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { Search, UserCheck, UserX, Shield } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

type UserRow = {
  uid: string; name: string; email: string;
  role: string; isActive: boolean; createdAt: Date;
  photoURL?: string;
};

const ROLE_STYLE: Record<string, { bg:string; color:string; label:string }> = {
  superadmin:  { bg:"rgba(157,127,212,0.2)", color:"#C4A8E8", label:"Super Admin" },
  admin:       { bg:"rgba(157,127,212,0.15)",color:"#9D7FD4", label:"Admin" },
  professional:{ bg:"rgba(251,191,36,0.15)", color:"#FBBF24", label:"Profissional" },
  client:      { bg:"rgba(74,222,128,0.1)",  color:"#4ADE80", label:"Cliente" },
};

export default function AdminUsuariosPage() {
  const [users, setUsers]     = useState<UserRow[]>([]);
  const [filtered, setFiltered] = useState<UserRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    getDocs(collection(db!, "users")).then(snap => {
      const list: UserRow[] = snap.docs.map(d => ({
        uid:      d.id,
        name:     String(d.data().name || ""),
        email:    String(d.data().email || ""),
        role:     String(d.data().role || "client"),
        isActive: d.data().isActive !== false,
        photoURL: d.data().photoURL,
        createdAt: d.data().createdAt instanceof Timestamp
          ? d.data().createdAt.toDate() : new Date(),
      }));
      setUsers(list.sort((a,b) => b.createdAt.getTime()-a.createdAt.getTime()));
      setLoading(false);
    }).catch(e => { console.error(e); setLoading(false); });
  }, []);

  useEffect(() => {
    let list = users;
    if (roleFilter !== "all") list = list.filter(u => u.role === roleFilter);
    if (search) list = list.filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(list);
  }, [users, search, roleFilter]);

  const toggleActive = async (u: UserRow) => {
    try {
      await updateDoc(doc(db!, "users", u.uid), { isActive: !u.isActive });
      setUsers(prev => prev.map(x => x.uid === u.uid ? { ...x, isActive: !x.isActive } : x));
      toast.success(u.isActive ? "Usuário desativado" : "Usuário ativado");
    } catch { toast.error("Erro"); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[24px] font-bold text-white"
          style={{ fontFamily:"Georgia,serif", fontStyle:"italic" }}>Usuários 👥</h1>
        <p className="text-[11px] text-white/25 mt-0.5">{users.length} cadastrados</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="w-full h-10 pl-9 pr-4 rounded-xl text-[12px] text-white placeholder-white/20 outline-none"
            style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)" }} />
        </div>
        <div className="flex gap-1.5">
          {["all","professional","client","superadmin"].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className="px-3 h-10 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all"
              style={roleFilter === r
                ? { background:"rgba(157,127,212,0.2)", color:"#C4A8E8", border:"1px solid rgba(157,127,212,0.3)" }
                : { background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.3)", border:"1px solid rgba(255,255,255,0.06)" }}>
              {r === "all" ? "Todos" : r === "professional" ? "Profis." : r === "superadmin" ? "Admin" : "Clientes"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <motion.div key={i} className="w-2 h-2 rounded-full bg-[#9D7FD4]"
                animate={{ y:[0,-8,0] }} transition={{ duration:0.6, delay:i*0.12, repeat:Infinity }} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u, i) => {
            const rs = ROLE_STYLE[u.role] || ROLE_STYLE.client;
            return (
              <motion.div key={u.uid}
                initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:i*0.02 }}
                className="flex items-center gap-3 p-3.5 rounded-2xl"
                style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
                <div className="h-9 w-9 rounded-xl flex items-center justify-center text-[12px] font-black text-white shrink-0 overflow-hidden"
                  style={{ background:"linear-gradient(135deg,#2A1A4E,#5A3F9A)" }}>
                  {u.photoURL
                    ? <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                    : u.name?.charAt(0).toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-white truncate">{u.name || "—"}</p>
                  <p className="text-[9px] text-white/25 truncate">{u.email}</p>
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full shrink-0"
                  style={{ background:rs.bg, color:rs.color }}>
                  {rs.label}
                </span>
                <p className="text-[9px] text-white/20 shrink-0 hidden sm:block">
                  {format(u.createdAt, "dd/MM/yy")}
                </p>
                <button onClick={() => toggleActive(u)}
                  className="h-8 w-8 rounded-xl flex items-center justify-center transition-all shrink-0"
                  style={{
                    background: u.isActive ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                    border: u.isActive ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(248,113,113,0.2)",
                  }}>
                  {u.isActive ? <UserCheck size={13} className="text-emerald-400" /> : <UserX size={13} className="text-red-400" />}
                </button>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center py-8 text-[12px] text-white/20">Nenhum usuário encontrado.</p>
          )}
        </div>
      )}
    </div>
  );
}
