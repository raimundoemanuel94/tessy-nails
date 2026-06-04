import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

// UID REAL da Tessy (descoberto via /debug)
const TESSY_UID = "alCK5NQbJSVSK1k6sjMAYOKBoR83";
const APP_NAME  = "create-services-v4";

const SERVICES = [
  { name: "Manicure simples",   price: 35,  durationMinutes: 45  },
  { name: "Pedicure simples",   price: 40,  durationMinutes: 60  },
  { name: "Manicure em gel",    price: 80,  durationMinutes: 90  },
  { name: "Pedicure em gel",    price: 90,  durationMinutes: 90  },
  { name: "Alongamento em gel", price: 150, durationMinutes: 120 },
  { name: "Esmaltação em gel",  price: 60,  durationMinutes: 60  },
  { name: "Spa dos pés",        price: 70,  durationMinutes: 75  },
  { name: "Nail art",           price: 15,  durationMinutes: 30  },
];

function getApp(): admin.app.App {
  const existing = admin.apps.find(a => a?.name === APP_NAME);
  if (existing) return existing;
  const privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDEtQMJEGqk2Bsi\n/wxmLagyqTZo4pNL23fODYNoCM5Lb2s/06QsOOXV7Y5Ar2kw/E7TUxUhtvlpK/nY\ncUQpZ5wkCCCKNGwbk7do6yubZQko3OR/zrfQgWntoBYs4VBgQcPh2mIhfq1+S3ZG\nd26jkVzvgdUSvOgYdMyOhfOb5pgpfZjnlVutuxeeqGC9VrtAaVYa4QJ7WUaFyVmw\nQ7L1X9ulOP7TiSFJu2r+3z4ZpxvSmgzY2bKVWYccntHnenvBNe3HJqPN+xmcLMbP\ne4TICQE/lVbSWJsoIf4gL9G+YAMeE2wOphCPVa5BLEq/wFjHegCsBLz6fLucbAe/\nCUkXRy+RAgMBAAECggEAHr7aNBr8SDq89xndUsU1IoH/TqKHelZZ4fuLvAGQWQsX\nvNi0MvNLvUXNs7+XFgCBw5cbWPM0BaPJf/KoQD6BEcKxb1ilQyQyCTSk0ruWlGv+\nTRm+8lif+XPJs4ceHIV6+/y51Nlrfa+G05nMUcWhPJBTAQRE1LnA1VALlSUUSHui\nKmgDXHMjKJLCV/R5eQkmdvvV6POObjTJ8W8cl1q0r3A+ep9f39prRTNgXhcWSUrP\nzP4Q1/38/HfJON4gc8ZqSp/btyTKh6W8H1O9Xu7KNLwQ8kuMIN1SyG4z8xJSe1Tj\nkWW+E4ei2V54FT4x0g3/KRmAc8H6r7JJtFa+wIM39wKBgQD2gdd6JuUT8PFp8G9v\ny0GVaupHy7y0/yMQxMoyFhlnNyNsjIpu+1Zd0c4D+gbquPI6dW8pe0JEG52It5Z6\nexgieZBz+nPoRz+qiEjjA/hEh7JMBCwC4rI2HGzgNMRWSrpx1POGSFY30EFOmAMn\nqCJLPJAB6CNXmmKD50ycgjeuGwKBgQDMSDjrcwFb/j0+yG9ABhcVV7LuGUa8/fc9\nrjtPwJc9G5oKaiL1jXQORc4fjva9hIqkWLK6O9Ivli9KWGfTsSIUGim6V2U2ZOBr\nqXSEVYlhRiGnXiminrHhSYaHl4WE0qndY/zaV9ltvnIqO/M/L7dyFLuhViPl2MB+\nEQf7z63DwwKBgQCHEOvE9WzNOVa9qk0U3zTHLvbBcgOq1KUc+gaj3PH8WPzi7Dqp\nxrMy4tNT4HpLwByRJWlMPEo50TvG/njIEYxOz3bz5UX+/pMG2He/U5yDyCpMdni6\n+AWXmomZa7Asa/OujXUFnbsIB+bQroAECZ8IxF1PfidnR6M1DNYwZzUlAwKBgQC5\n3QxMzPpzpMI8mUj/S4s9E+ns0HqYAcouCJRWX7g7FR32U9My71ykj8aW2BCPJkSu\nezVCVKNMQK0OS5lL9mI3QAavUEz6TJYT3r3wmZLBOnnsObRQDWtyut74B1ioHLQI\nhqzMTBm7zAc7fgg3eUbDOTHt/N30hl29VemZpr9G2QKBgDPDh7L6nyxPMdUTtnKf\nnG+FXcNFWOywCzQAR2h4uvpjfWYool18KCY8omqupZEtNMm8V54Ohtc4FvJdQLJ4\nbcxNAd66HLJRgds2Eb5zASE1yW2/PyURxMEfVUM7q4X3JkEq8mAcNf1x3ZlTnixB\n6FYuwpwr1NHqC50jjlL2BEQj\n-----END PRIVATE KEY-----\n";
  return admin.initializeApp({ credential: admin.credential.cert({ projectId: "nailit-792a7", clientEmail: "firebase-adminsdk-fbsvc@nailit-792a7.iam.gserviceaccount.com", privateKey }) }, APP_NAME);
}

export async function POST(req: NextRequest) {
  if (req.headers.get("x-setup-secret") !== "nailit-setup-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db  = admin.firestore(getApp());
    const now = admin.firestore.FieldValue.serverTimestamp();
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    // 1. Atualiza users/{uid} com studioId correto
    await db.collection("users").doc(TESSY_UID).set({
      uid: TESSY_UID, name: "Tessy Nails", email: "tessynails.contato@gmail.com",
      role: "professional", studioId: TESSY_UID, isActive: true, updatedAt: now,
    }, { merge: true });

    // 2. Cria/atualiza studios/{uid}
    await db.collection("studios").doc(TESSY_UID).set({
      name: "Tessy Nails", ownerId: TESSY_UID, slug: "tessy-nails",
      plan: "pro", isActive: true,
      trialEndsAt: admin.firestore.Timestamp.fromDate(trialEndsAt), updatedAt: now,
    }, { merge: true });

    // 3. Cria serviços (sem duplicar)
    const ref = db.collection("studios").doc(TESSY_UID).collection("services");
    const existing = await ref.get();
    const existingNames = new Set(existing.docs.map(d => d.data().name as string));

    let created = 0, skipped = 0;
    for (const svc of SERVICES) {
      if (existingNames.has(svc.name)) { skipped++; continue; }
      await ref.add({ ...svc, bufferMinutes: 0, isActive: true, studioId: TESSY_UID, createdAt: now });
      created++;
    }

    return NextResponse.json({ success: true, tessyUid: TESSY_UID, created, skipped, total: SERVICES.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
