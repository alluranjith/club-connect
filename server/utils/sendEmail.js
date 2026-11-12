const sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.FROM_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'ClubConnect';

  // If Brevo isn't configured, log instead of throwing - keeps dev flow unblocked.
  if (!apiKey || !senderEmail) {
    console.log('--- EMAIL (Brevo not configured, logging only) ---');
    console.log('To:', to, '\nSubject:', subject, '\nHTML:', html);
    return;
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Brevo API error (${response.status}): ${errBody}`);
  }
};

module.exports = sendEmail;
