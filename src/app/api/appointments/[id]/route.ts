import { NextResponse } from "next/server";
import { admin, getFirebaseAdminApp } from "@/lib/firebaseAdmin";
import {
  authGuardErrorResponse,
  isAuthGuardError,
  requireAuth,
} from "@/lib/server/route-guards";

type AppointmentDocData = {
  clientId?: string;
  serviceId?: string;
  appointmentDate?: unknown;
  status?: string;
  notes?: string | null;
};

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }

  const parsed = new Date(value as string | number);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "ID do agendamento e obrigatorio" }, { status: 400 });
    }

    const app = getFirebaseAdminApp();
    if (!app) {
      return NextResponse.json({ error: "Firebase Admin nao configurado" }, { status: 503 });
    }

    const db = admin.firestore(app);
    const appointmentRef = db.collection("appointments").doc(id);
    const appointmentSnap = await appointmentRef.get();

    if (!appointmentSnap.exists) {
      return NextResponse.json({ error: "Agendamento nao encontrado" }, { status: 404 });
    }

    const appointment = appointmentSnap.data() as AppointmentDocData;
    const appointmentClientId = appointment.clientId ?? "";
    const serviceId = appointment.serviceId ?? "";

    if (session.role === "client" && appointmentClientId !== session.uid) {
      return NextResponse.json({ error: "Acesso negado ao agendamento" }, { status: 403 });
    }

    const [serviceSnap, clientSnap] = await Promise.all([
      serviceId ? db.collection("services").doc(serviceId).get() : Promise.resolve(null),
      appointmentClientId
        ? db.collection("clients").doc(appointmentClientId).get()
        : Promise.resolve(null),
    ]);

    let clientName = "Cliente";
    if (clientSnap?.exists) {
      const clientData = clientSnap.data() as { name?: string };
      clientName = clientData.name ?? clientName;
    } else if (appointmentClientId) {
      const userSnap = await db.collection("users").doc(appointmentClientId).get();
      if (userSnap.exists) {
        const userData = userSnap.data() as { name?: string };
        clientName = userData.name ?? clientName;
      }
    }

    const serviceData = serviceSnap?.exists
      ? (serviceSnap.data() as { name?: string; price?: number; durationMinutes?: number })
      : null;

    const appointmentDate = toDate(appointment.appointmentDate);
    if (!appointmentDate) {
      return NextResponse.json({ error: "Data do agendamento invalida" }, { status: 422 });
    }

    return NextResponse.json({
      appointment: {
        id: appointmentSnap.id,
        status: appointment.status ?? "pending",
        notes: appointment.notes ?? null,
        appointmentDate: appointmentDate.toISOString(),
        client: {
          id: appointmentClientId,
          name: clientName,
        },
        service: {
          id: serviceId,
          name: serviceData?.name ?? "Servico",
          price: Number(serviceData?.price ?? 0),
          durationMinutes: Number(serviceData?.durationMinutes ?? 60),
        },
      },
    });
  } catch (error) {
    if (isAuthGuardError(error)) {
      return authGuardErrorResponse(error);
    }

    const message =
      error instanceof Error ? error.message : "Falha ao buscar detalhes do agendamento";
    console.error("Erro ao buscar agendamento por ID:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
