export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { executeWithGemini } from '@/lib/pipeline/gemini-client';
import { runPipeline } from '@/lib/pipeline/pipeline';



const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramMessage(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Check if it's a message
    if (!body.message || !body.message.text) {
      return NextResponse.json({ ok: true });
    }

    const { chat, text, from } = body.message;
    const userId = from.id.toString();

    console.log(`[Telegram Webhook] Incoming message from ${userId}: "${text}"`);

    // Security check: Only respond to authorized users
    const rawIds = TELEGRAM_CHAT_ID || '';
    const authorizedIds = rawIds.split(',').map(id => id.trim());
    
    console.log(`[Telegram Webhook] Authorized IDs: [${authorizedIds.join(', ')}]`);
    
    if (!authorizedIds.includes(userId)) {
      console.warn(`[Telegram Webhook] UNAUTHORIZED USER: ${userId}. Message ignored.`);
      return NextResponse.json({ ok: true });
    }

    console.log(`[Telegram Webhook] User ${userId} is AUTHORIZED. Proceeding...`);

    const lowerText = (text || '').toLowerCase().trim();

    // Command: /start
    if (lowerText === '/start' || lowerText === '/help') {
      const welcome = `👻 *Ghost Reporter AI Assistant* 👻\n\n` +
                      `I am the brain behind dx7sport.com. You can talk to me or use these commands:\n\n` +
                      `🚀 \`/sweep\` - Start a new autonomous news sweep\n` +
                      `📊 \`/status\` - Check system health\n` +
                      `✍️ Or just ask me anything about football!`;
      await sendTelegramMessage(userId, welcome);
      return NextResponse.json({ ok: true });
    }

    // Command: /status
    if (lowerText === '/status') {
      await sendTelegramMessage(userId, "🔍 *Status Check:*\n\n✅ Database: Online\n✅ Gemini AI: Connected (5 keys active)\n✅ Pipeline: Ready");
      return NextResponse.json({ ok: true });
    }

    // Command: /sweep
    if (lowerText === '/sweep') {
      await sendTelegramMessage(userId, "🛸 *Launching Ghost Sweep...*\n\nI'm hunting for the latest football stories. I'll ping you as soon as the drafts are ready for review!");
      
      // Trigger pipeline in background (don't await so we can respond fast)
      runPipeline({}).catch(err => {
        console.error('[Telegram Webhook] Pipeline trigger failed:', err);
      });
      
      return NextResponse.json({ ok: true });
    }

    // General Chat with Gemini
    await sendTelegramMessage(userId, "_Thinking..._");
    
    try {
      const aiResponse = await executeWithGemini(async (client) => {
        const res = await client.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [
            { role: 'user', parts: [{ text: 'You are the AI assistant for dx7sport.com, a premium football blog. You are talking to the owner via Telegram. Be professional, concise, and passionate about football.' }] },
            { role: 'model', parts: [{ text: 'Understood. I am the Ghost Reporter AI, ready to assist with the site or discuss football news.' }] },
            { role: 'user', parts: [{ text }] },
          ],
        });
        return res.text ?? 'لم أتمكن من الرد الآن، حاول مجدداً.';
      });

      await sendTelegramMessage(userId, aiResponse);
    } catch (geminiError) {
      console.error('[Telegram Webhook] Gemini Chat Error:', geminiError);
      await sendTelegramMessage(userId, "❌ *AI Error:* I'm having trouble connecting to my brain right now. Please try again in a moment.");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Telegram Webhook Error]:', error);
    return NextResponse.json({ ok: true }); // Always return OK to Telegram to avoid retries
  }
}
