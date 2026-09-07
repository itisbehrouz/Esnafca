import { prisma } from "../src/lib/db";

export async function seedBoostData() {
  console.log("🌱 Seeding Boost Modules Data (Staff, Subscriptions, Payments, Logistics)...");

  // 1. Staff Members
  const staffToUpsert = [
    {
      id: "staff-super-admin",
      name: "Demo Süper Yönetici",
      email: "admin@example.com",
      phone: "0532 100 20 30",
      role: "SUPER_ADMIN",
      title: "Süper Yönetici",
      status: "ACTIVE",
    },
    {
      id: "staff-operator-1",
      name: "Demo Operatör",
      email: "operator@example.com",
      phone: "0533 200 40 50",
      role: "OPERATOR",
      title: "Esnaf Operasyon Uzmanı",
      status: "ACTIVE",
    },
    {
      id: "staff-compliance-1",
      name: "Demo Kalite Denetçisi",
      email: "compliance@example.com",
      phone: "0534 300 50 60",
      role: "COMPLIANCE",
      title: "Kalite & Uyum Denetçisi",
      status: "ACTIVE",
    },
  ];

  for (const s of staffToUpsert) {
    await prisma.staffMember.upsert({
      where: { email: s.email },
      update: {
        name: s.name,
        phone: s.phone,
        role: s.role,
        title: s.title,
        status: s.status,
      },
      create: s,
    });
  }
  console.log("✅ Staff directory seeded.");

  // 2. Subscriptions for Pro & Plus Merchants
  const paidMerchants = await prisma.merchant.findMany({
    where: { tier: { in: ["pro", "plus"] } },
  });

  const now = new Date();

  for (const m of paidMerchants) {
    const existingSub = await prisma.subscription.findFirst({
      where: { merchantId: m.id },
    });

    const price = m.tier === "plus" ? 890 : 390;
    const renewalDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days later
    const periodEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    if (!existingSub) {
      await prisma.subscription.create({
        data: {
          merchantId: m.id,
          tier: m.tier,
          price,
          status: "active",
          billingInterval: "monthly",
          startDate: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000),
          currentPeriodEnd: periodEnd,
          nextRenewalDate: renewalDate,
          cancelAtPeriodEnd: false,
        },
      });

      // Also create a successful payment log
      await prisma.paymentTransaction.create({
        data: {
          merchantId: m.id,
          amount: price,
          currency: "TRY",
          status: "SUCCESS",
          provider: Math.random() > 0.5 ? "iyzico" : "paytr",
          paymentId: `pay_rec_${m.id.slice(-6)}_${Date.now()}`,
          payload: JSON.stringify({
            tier: m.tier,
            period: "2026-09",
            cardLast4: "4242",
            authCode: "AUTH99881",
          }),
        },
      });
    }
  }
  console.log(`✅ Subscriptions seeded for ${paidMerchants.length} merchants.`);

  // 3. Simulated Payment Failure and Webhook Recovery Logs
  const failTx = await prisma.paymentTransaction.findFirst({
    where: { status: "FAILED" },
  });
  if (!failTx && paidMerchants.length > 0) {
    await prisma.paymentTransaction.create({
      data: {
        merchantId: paidMerchants[0].id,
        amount: 390,
        currency: "TRY",
        status: "FAILED",
        provider: "iyzico",
        paymentId: `pay_fail_${Date.now()}`,
        failureReason: "Kart limiti yetersiz veya 3D Secure zaman aşımı (Do Not Honor - 51)",
        payload: JSON.stringify({
          tier: "pro",
          errorCode: "51",
          errorMessage: "Insufficient funds / Limit yetersiz",
          retryCount: 1,
        }),
      },
    });
  }

  // 4. Stand Shipments (Logistics)
  const allVerifiedMerchants = await prisma.merchant.findMany({
    where: { verified: true },
    take: 8,
  });

  const shipmentStatuses = ["PENDING_PRINT", "PRINTING", "SHIPPED", "DELIVERED"];
  const carriers = ["Yurtiçi Kargo", "Aras Kargo", "MNG Kargo", "Kolay Gelsin"];

  for (let i = 0; i < allVerifiedMerchants.length; i++) {
    const m = allVerifiedMerchants[i];
    const existingShipment = await prisma.standShipment.findFirst({
      where: { merchantId: m.id },
    });

    if (!existingShipment) {
      const status = shipmentStatuses[i % shipmentStatuses.length];
      const carrier = status === "SHIPPED" || status === "DELIVERED" ? carriers[i % carriers.length] : null;
      const tracking = carrier ? `YK${Math.floor(1000000000 + Math.random() * 9000000000)}` : null;

      await prisma.standShipment.create({
        data: {
          merchantId: m.id,
          status,
          carrier,
          trackingNumber: tracking,
          recipientName: m.masterName || m.name,
          recipientPhone: m.phone,
          shippingAddress: `${m.address}, ${m.neighborhood}, ${m.district} / ${m.city}`,
          shippedAt: status === "SHIPPED" || status === "DELIVERED" ? new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) : null,
          deliveredAt: status === "DELIVERED" ? new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) : null,
          notes: i % 2 === 0 ? "Pleksi stand + 2 adet kapı çıkartması dahil edildi." : "Öncelikli teslimat",
          qrPayloadUrl: `https://esnafca.com/esnaf/${m.slug}`,
        },
      });
    }
  }
  console.log("✅ Stand shipments seeded.");

  // 5. Sample Appointments for Appointments Desk
  const existingApts = await prisma.appointment.count();
  if (existingApts === 0 && paidMerchants.length > 0) {
    const m1 = paidMerchants[0];
    const m2 = paidMerchants.length > 1 ? paidMerchants[1] : paidMerchants[0];
    const servicesM1 = await prisma.serviceItem.findMany({ where: { merchantId: m1.id } });
    const servicesM2 = await prisma.serviceItem.findMany({ where: { merchantId: m2.id } });

    await prisma.appointment.create({
      data: {
        merchantId: m1.id,
        serviceId: servicesM1[0]?.id || null,
        customerName: "Canan Yılmaz",
        customerPhone: "05321112233",
        customerNote: "İlk randevum, lütfen saç modelleme için zaman ayıralım.",
        date: "2026-10-16",
        startTime: "11:00",
        endTime: "11:45",
        price: servicesM1[0]?.minPrice || 350,
        status: "confirmed",
      },
    });

    if (m2.id !== m1.id) {
      await prisma.appointment.create({
        data: {
          merchantId: m2.id,
          serviceId: servicesM2[0]?.id || null,
          customerName: "Murat Demir",
          customerPhone: "05334445566",
          customerNote: "Periyodik bakım ve kontrol.",
          date: "2026-10-16",
          startTime: "14:30",
          endTime: "15:30",
          price: servicesM2[0]?.minPrice || 450,
          status: "pending",
        },
      });
    } else {
      await prisma.appointment.create({
        data: {
          merchantId: m1.id,
          serviceId: servicesM1[0]?.id || null,
          customerName: "Murat Demir",
          customerPhone: "05334445566",
          customerNote: "Periyodik bakım ve kontrol.",
          date: "2026-10-16",
          startTime: "15:00",
          endTime: "16:00",
          price: servicesM1[0]?.minPrice || 450,
          status: "pending",
        },
      });
    }
    console.log("✅ Sample appointments seeded.");
  }

  console.log("🎉 Seed boost data finished successfully.");
}

seedBoostData()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
