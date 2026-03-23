import { NextResponse } from "next/server";
import admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      }),
    });
  } catch (error) {
    console.error("Error initializing Firebase Admin for Availability API:", error);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json({ error: "Parâmetros 'start' e 'end' são obrigatórios" }, { status: 400 });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const db = admin.firestore();
    const snapshot = await db
      .collection("appointments")
      .where("appointmentDate", ">=", startDate)
      .where("appointmentDate", "<=", endDate)
      .get();

    const busySlots = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        appointmentDate: data.appointmentDate.toDate(),
        status: data.status,
        serviceId: data.serviceId,
      };
    });

    // Filter only relevant active appointments
    const filteredSlots = busySlots.filter((slot) =>
      ["pending", "confirmed", "completed"].includes(slot.status)
    );

    return NextResponse.json({ busySlots: filteredSlots });
  } catch (error: any) {
    console.error("Error fetching availability:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
