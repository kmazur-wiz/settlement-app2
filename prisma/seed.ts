import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ─── Exchange Rates ────────────────────────────────────────────────────────
  await db.exchangeRate.upsert({
    where: { currency_validFrom: { currency: "EUR", validFrom: new Date("2026-01-01") } },
    create: { currency: "EUR", rate: 4.26, validFrom: new Date("2026-01-01"), createdBy: "seed" },
    update: {},
  });
  await db.exchangeRate.upsert({
    where: { currency_validFrom: { currency: "GBP", validFrom: new Date("2026-01-01") } },
    create: { currency: "GBP", rate: 5.01, validFrom: new Date("2026-01-01"), createdBy: "seed" },
    update: {},
  });

  // ─── Admin user ─────────────────────────────────────────────────────────────
  const adminPass = await bcrypt.hash("admin123", 12);
  const admin = await db.user.upsert({
    where: { email: "admin@telemedi.com" },
    create: {
      email: "admin@telemedi.com",
      name: "Administrator",
      role: "ADMIN",
      passwordHash: adminPass,
      isActive: true,
    },
    update: {},
  });
  console.log("Admin created:", admin.email);

  // ─── Accounting user ─────────────────────────────────────────────────────────
  const accPass = await bcrypt.hash("accounting123", 12);
  await db.user.upsert({
    where: { email: "accounting@telemedi.com" },
    create: {
      email: "accounting@telemedi.com",
      name: "Dział Rozliczeń",
      role: "ACCOUNTING",
      passwordHash: accPass,
      isActive: true,
    },
    update: {},
  });

  // ─── Polish doctors (Model B) ─────────────────────────────────────────────
  const plDoctors = [
    { email: "jan.kowalski@telemedi.com", name: "Jan Kowalski", externalId: "PL001" },
    { email: "anna.nowak@telemedi.com",   name: "Anna Nowak",   externalId: "PL002" },
  ];

  for (const d of plDoctors) {
    const user = await db.user.upsert({
      where: { email: d.email },
      create: { email: d.email, name: d.name, role: "DOCTOR", isActive: true },
      update: {},
    });
    const doctor = await db.doctor.upsert({
      where: { userId: user.id },
      create: { userId: user.id, type: "PL", currency: "PLN", externalId: d.externalId },
      update: {},
    });
    await db.contractModel.upsert({
      where: { doctorId: doctor.id },
      create: {
        doctorId: doctor.id,
        model: "B",
        params: JSON.stringify({
          base_fee: 5000,
          threshold: 60,
          rate_above: 40,
          count_failed_as_consultations: false,
          rate_presc: 5,
          schedule_condition: true,
          proration_if_not_met: true,
          required_slot_coverage: "Mon-Fri 08:00-16:00",
        }),
        createdBy: "seed",
      },
      update: {},
    });
    console.log("PL Doctor:", d.name, doctor.id);
  }

  // ─── Czech doctor (Model C_OPL) ──────────────────────────────────────────
  const czUser = await db.user.upsert({
    where: { email: "jan.novak@telemedi.com" },
    create: { email: "jan.novak@telemedi.com", name: "Jan Novák", role: "DOCTOR", isActive: true },
    update: {},
  });
  const czDoctor = await db.doctor.upsert({
    where: { userId: czUser.id },
    create: { userId: czUser.id, type: "GLOBAL", country: "Czech Republic", currency: "EUR", externalId: "CZ001" },
    update: {},
  });
  await db.contractModel.upsert({
    where: { doctorId: czDoctor.id },
    create: {
      doctorId: czDoctor.id,
      model: "C_OPL",
      params: JSON.stringify({
        base_day: 800,
        tier1_threshold: 80,
        tier1_rate: 8,
        tier2_threshold: 120,
        tier2_rate: 6,
        night_base_fee: 300,
        night_threshold: 30,
        night_rate_above: 9,
        prescription_rate: 2,
        proration_if_not_met: true,
      }),
      createdBy: "seed",
    },
    update: {},
  });

  // ─── Spanish doctor (Model A) ────────────────────────────────────────────
  const esUser = await db.user.upsert({
    where: { email: "maria.garcia@telemedi.com" },
    create: { email: "maria.garcia@telemedi.com", name: "María García", role: "DOCTOR", isActive: true },
    update: {},
  });
  const esDoctor = await db.doctor.upsert({
    where: { userId: esUser.id },
    create: { userId: esUser.id, type: "GLOBAL", country: "Spain", currency: "EUR", externalId: "ES001" },
    update: {},
  });
  await db.contractModel.upsert({
    where: { doctorId: esDoctor.id },
    create: {
      doctorId: esDoctor.id,
      model: "A",
      params: JSON.stringify({
        rate_ended: 12,
        rate_ended_night: 15,
        rate_failed: 4,
        rate_presc: 2,
        rempe: 0,
      }),
      createdBy: "seed",
    },
    update: {},
  });

  // ─── Austrian doctor (Model F) ──────────────────────────────────────────
  const atUser = await db.user.upsert({
    where: { email: "thomas.mueller@telemedi.com" },
    create: { email: "thomas.mueller@telemedi.com", name: "Thomas Müller", role: "DOCTOR", isActive: true },
    update: {},
  });
  const atDoctor = await db.doctor.upsert({
    where: { userId: atUser.id },
    create: { userId: atUser.id, type: "GLOBAL", country: "Austria", currency: "EUR", externalId: "AT001" },
    update: {},
  });
  await db.contractModel.upsert({
    where: { doctorId: atDoctor.id },
    create: {
      doctorId: atDoctor.id,
      model: "F",
      params: JSON.stringify({
        ds1: { enabled: true, schedule: "07:00-12:00", standby_rate: 30, cons_rate: 10 },
        ds2: { enabled: true, schedule: "12:00-19:00", standby_rate: 25, cons_rate: 10 },
        ds3: { enabled: true, schedule: "19:00-07:00", standby_rate: 20, cons_rate: 12 },
        wh:  { enabled: true, standby_rate: 35, cons_rate: 12, included_cons: 1 },
        monthly: { enabled: true, fixed_amount: 500, required_shifts: 20 },
      }),
      createdBy: "seed",
    },
    update: {},
  });

  // ─── Serbian doctor group (Model E) ─────────────────────────────────────
  const srGroup = await db.doctorGroup.upsert({
    where: { id: "group-serbia" },
    create: { id: "group-serbia", name: "Serbia Pool" },
    update: {},
  });

  const srUser = await db.user.upsert({
    where: { email: "nikola.petrovic@telemedi.com" },
    create: { email: "nikola.petrovic@telemedi.com", name: "Nikola Petrović", role: "DOCTOR", isActive: true },
    update: {},
  });
  const srDoctor = await db.doctor.upsert({
    where: { userId: srUser.id },
    create: { userId: srUser.id, type: "GLOBAL", country: "Serbia", currency: "EUR", externalId: "SR001", groupId: srGroup.id },
    update: {},
  });
  await db.contractModel.upsert({
    where: { doctorId: srDoctor.id },
    create: {
      doctorId: srDoctor.id,
      model: "E",
      params: JSON.stringify({
        pool_amount: 3000,
        rate_per_cons: 15,
        client_name: "Telemedi Serbia",
      }),
      createdBy: "seed",
    },
    update: {},
  });

  // ─── Portuguese doctor (Model D) ─────────────────────────────────────────
  const ptUser = await db.user.upsert({
    where: { email: "jorge.silva@telemedi.com" },
    create: { email: "jorge.silva@telemedi.com", name: "Jorge Silva", role: "DOCTOR", isActive: true },
    update: {},
  });
  const ptDoctor = await db.doctor.upsert({
    where: { userId: ptUser.id },
    create: { userId: ptUser.id, type: "GLOBAL", country: "Portugal", currency: "EUR", externalId: "PT001" },
    update: {},
  });
  await db.contractModel.upsert({
    where: { doctorId: ptDoctor.id },
    create: {
      doctorId: ptDoctor.id,
      model: "D",
      params: JSON.stringify({
        rate_hour: 20,
        rate_ended: 15,
        rate_failed: 5,
        rate_presc: 2,
        has_base_fee: true,
        base_fee: 1200,
        threshold: 40,
      }),
      createdBy: "seed",
    },
    update: {},
  });

  console.log("\nSeed complete!");
  console.log("Login: admin@telemedi.com / admin123");
  console.log("Login: accounting@telemedi.com / accounting123");
  console.log("Doctors: jan.kowalski, anna.nowak, jan.novak, maria.garcia, thomas.mueller, nikola.petrovic, jorge.silva");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
