/**
 * WhatsApp Notification Integration
 * Uses the CallMeBot API to send WhatsApp messages for article review alerts.
 */

export async function sendNotification(title: string, articleId: number): Promise<void> {
  const phone = process.env.WHATSAPP_PHONE; // Format: +34123456789
  const apiKey = process.env.WHATSAPP_API_KEY;

  if (!phone || !apiKey) {
    console.warn('[Notifications] Skip WhatsApp: WHATSAPP_PHONE or WHATSAPP_API_KEY not configured.');
    return;
  }

  const reviewUrl = `https://dx7sport.com/admin/article/${articleId}`;
  
  // CallMeBot requires URL encoding for the text
  const message = `🚨 *New Draft Ready!* 🚨\n\n` +
                  `📝 *Title:* ${title}\n\n` +
                  `🔗 *Review & Publish:* ${reviewUrl}`;

  const apiUrl = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(apiUrl);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[Notifications] WhatsApp API Error:', errorText);
    } else {
      console.log('[Notifications] WhatsApp alert sent successfully.');
    }
  } catch (err) {
    console.error('[Notifications] Failed to send WhatsApp alert:', err);
  }
}
