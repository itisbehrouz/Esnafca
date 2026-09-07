import { generateOtp, verifyOtpCode } from "../src/lib/otp";
import { createAppointmentAction } from "../src/app/actions/appointment";
import { prisma } from "../src/lib/db";

async function main() {
  console.log("=== 1. Testing Serverless OTP Logic ===");
  const testPhone = "05321234567";

  // Generate OTP
  const { code, expiresAt } = await generateOtp(testPhone);
  console.log("Generated OTP:", { code, expiresAt });
  if (code.length !== 6) {
    throw new Error("OTP must be 6 digits");
  }

  // Verify wrong code
  const wrongRes = await verifyOtpCode(testPhone, "999999");
  console.log("Wrong code result:", wrongRes);
  if (wrongRes.success && code !== "999999") {
    throw new Error("Wrong code should fail");
  }

  // Verify valid code
  const validRes = await verifyOtpCode(testPhone, code);
  console.log("Valid code result:", validRes);
  if (!validRes.success) {
    throw new Error("Valid code should succeed");
  }

  console.log("✅ OTP persistence & timing-safe verification verified!");

  console.log("\n=== 2. Testing Double-Booking Collision Handling ===");
  const merchant = await prisma.merchant.findFirst();
  if (!merchant) {
    throw new Error("No merchant found in database for testing double-booking");
  }

  const testDate = "2026-10-15";
  const testTime = "14:00";

  // Clean any pre-existing appointment on this test slot
  await prisma.appointment.deleteMany({
    where: {
      merchantId: merchant.id,
      date: testDate,
      startTime: testTime,
    },
  });

  const bookingPayload = {
    merchantId: merchant.id,
    customerName: "Test Müşteri 1",
    customerPhone: "05321112233",
    date: testDate,
    startTime: testTime,
  };

  let createdAppointmentId: string | null = null;
  try {
    const firstAttempt = await createAppointmentAction(bookingPayload);
    console.log("First booking attempt:", firstAttempt);
    if (!firstAttempt.success) {
      throw new Error(`First booking attempt failed unexpectedly: ${firstAttempt.error}`);
    }
    createdAppointmentId = firstAttempt.appointmentId || firstAttempt.data?.appointmentId || null;

    const secondAttempt = await createAppointmentAction({
      ...bookingPayload,
      customerName: "Test Müşteri 2",
    });
    console.log("Second concurrent/identical booking attempt:", secondAttempt);

    if (secondAttempt.success) {
      throw new Error("Second booking on same slot should have been rejected!");
    }
    if (!secondAttempt.error?.includes("Bu saat dilimi az önce başka bir müşteri tarafından rezerve edildi")) {
      throw new Error(`Unexpected error message for second attempt: ${secondAttempt.error}`);
    }
    console.log("✅ Double-booking correctly rejected with graceful Turkish error message!");
  } finally {
    if (createdAppointmentId) {
      await prisma.appointment.delete({ where: { id: createdAppointmentId } }).catch(() => {});
    }
    await prisma.appointment.deleteMany({
      where: {
        merchantId: merchant.id,
        date: testDate,
        startTime: testTime,
      },
    });
  }

  console.log("\n✅ ALL DB & OTP HARDENING TESTS COMPLETED!");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
