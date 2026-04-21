import { NextResponse } from "next/server";
import { admin, getFirebaseAdminApp } from "@/lib/firebaseAdmin";
import { z } from "zod";

// ✅ Validar datas ISO
const AvailabilityQuerySchema = z.object({
  start: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/)),
  end: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/)),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json(
        { error: "Parametros 'start' e 'end' sao obrigatorios" },
        { status: 400 }
      );
    }

    // ✅ Validar formato ISO
    const validation = AvailabilityQuerySchema.safeParse({ start, end });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Datas devem estar em formato ISO 8601 válido", details: validation.error.issues },
        { status: 400 }
      );
    }

    const app = getFirebaseAdminApp();

    if (!app) {
      return NextResponse.json(
        { error: "Firebase Admin nao configurado" },
        { status: 500 }
      );
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    // ✅ Validar se datas são válidas
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Datas inválidas fornecidas" },
        { status: 400 }
      );
    }

    // ✅ Validar se startDate < endDate
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: "Data de início deve ser anterior à data de fim" },
        { status: 400 }
      );
    }

    const snapshot = await admin
      .firestore(app)
      .collection("appointments")
      .where("appointmentDate", ">=", startDate)
      .where("appointmentDate", "<=", endDate)
      .get();

    const busySlots = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          appointmentDate: data.appointmentDate.toDate(),
          status: data.status,
          serviceId: data.serviceId,
        };
      })
      .filter((slot) => ["pending", "confirmed", "completed"].includes(slot.status));

    return NextResponse.json({ busySlots });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao buscar disponibilidade";
    console.error("Error fetching availability:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
