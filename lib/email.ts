import "server-only";

export async function sendActivationCodeEmail(
  to: string,
  activationCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to,
        subject: "Your gift activation code",
        html: `<p>Your gift application has been approved!</p><p>Activation code: <strong>${activationCode}</strong></p><p>Enter it at <a href="${process.env.NEXT_PUBLIC_APP_URL}/activate">${process.env.NEXT_PUBLIC_APP_URL}/activate</a> to activate your access.</p>`,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      return {
        success: false,
        error: body?.message ?? `Resend API error (${response.status})`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
