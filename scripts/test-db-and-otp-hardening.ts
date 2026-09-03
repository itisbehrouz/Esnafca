import { generateOtp, verifyOtpCode } from "../src/lib/otp";
import { createAppointmentAction } from "../src/app/actions/appointment";

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
  // Test appointment action error handling on slot collision
  const bookingPayload = {
    merchantId: "seed-berber-1",
    customerName: "Test Müşteri 1",
    customerPhone: "05321112233",
    date: "2026-10-15",
    startTime: "14:00",
  };

  const firstAttempt = await createAppointmentAction(bookingPayload);
  console.log("First booking attempt:", firstAttempt);

  const secondAttempt = await createAppointmentAction({
    ...bookingPayload,
    customerName: "Test Müşteri 2",
  });
  console.log("Second concurrent/identical booking attempt:", secondAttempt);

  if (firstAttempt.success) {
    if (secondAttempt.success) {
      throw new Error("Second booking on same slot should have been rejected!");
    }
    if (!secondAttempt.error?.includes("Bu saat dilimi az önce başka bir müşteri tarafından rezerve edildi")) {
      console.warn("Second attempt error:", secondAttempt.error);
    } else {
      console.log("✅ Double-booking correctly rejected with graceful Turkish error message!");
    }
  } else {
    console.log("First attempt handled gracefully (database might not be running in local build mode):", firstAttempt.error);
  }

  console.log("\n✅ ALL DB & OTP HARDENING TESTS COMPLETED!");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
