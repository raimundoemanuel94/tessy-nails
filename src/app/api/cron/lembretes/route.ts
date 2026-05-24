import { NextResponse } from "next/server";
import { notifyUser } from "@/lib/server/notify";
import { getFirebaseAdminApp, admin } from "@/lib/firebaseAdmin";
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const app = getFirebaseAdminApp();
  if (!app) return NextResponse.json({ error: "Firebase Admin não configurado" }, { status: 503 });

  try {
    const db = admin.firestore(app);
    const tomorrow = addDays(new Date(), 1);
    const start = startOfDay(tomorrow);
    const end   = endOfDay(tomorrow);

    const snap = await db.collection("appointments")
      .where("appointmentDate", ">=", start)
      .where("appointmentDate", "<=", end)
      .where("status", "in", ["pending", "confirmed"])
      .get();

    if (snap.empty) return NextResponse.json({ ok: true, notified: 0 });

    const serviceIds = [...new Set(snap.docs.map(d => d.data().serviceId as string))];
    const serviceSnaps = await Promise.allSettled(
      serviceIds.map(id => db.collection("services").doc(id).get())
    );
    const serviceMap = new Map<string, string>();
    serviceSnaps.forEach((r, i) => {
      const sid = serviceIds[i];
      if (r.status === "fulfilled" && r.value.exists && sid)
        serviceMap.set(sid, String(r.value.data()?.name ?? "seu serviço"));
    });

    let notified = 0;
    await Promise.allSettled(
      snap.docs.map(async doc => {
        const data = doc.data();
        const apptDate  = (data.appointmentDate?.toDate?.() ?? new Date(data.appointmentDate)) as Date;
        const name      = serviceMap.get(data.serviceId as string) ?? "seu serviço";
        const timeStr   = format(apptDate, "HH:mm", { locale: ptBR });
        await notifyUser(data.clientId as string, {
          title: "⏰ Lembrete de amanhã!",
          body: `${name} às ${timeStr}. Te esperamos! 💜`,
          url: "/cliente/agendamentos",
          tag: `reminder-${doc.id}`,
        });
        notified++;
      })
    );

    return NextResponse.json({ ok: true, notified, total: snap.size });
  } catch (err) {
    console.error("[cron/lembretes]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
