const { Resend } = require("resend");

const hasResendConfig = () => {
  return Boolean(process.env.RESEND_API_KEY);
};

const sendAccountCreatedEmail = async ({ toEmail, name }) => {
  if (!hasResendConfig()) {
    console.warn("Resend is not configured. Skipping account-created email.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const displayName = name?.trim() || "there";
  const from = process.env.RESEND_FROM || "MoodEats <onboarding@resend.dev>";

  const result = await resend.emails.send({
    from,
    to: toEmail,
    subject: "Welcome to MoodEats 🎉",
    text: `Hi ${displayName},\n\nYour MoodEats account has been created successfully.\n\nYou can now log in and start getting food suggestions based on your mood.\n\n- MoodEats Team`,
    html: `<p>Hi ${displayName},</p><p>Your MoodEats account has been created successfully.</p><p>You can now log in and start getting food suggestions based on your mood.</p><p>— MoodEats Team</p>`,
  });

  if (result?.error) {
    const errorMessage = result.error.message || "Resend email send failed";

    if (errorMessage.includes("You can only send testing emails to your own email address")) {
      const restrictionError = new Error(
        `Resend test-mode restriction: cannot send welcome email to ${toEmail}.`
      );
      restrictionError.code = "RESEND_TEST_MODE_RECIPIENT_RESTRICTED";
      throw restrictionError;
    }

    throw new Error(errorMessage);
  }
};

module.exports = {
  sendAccountCreatedEmail,
};
