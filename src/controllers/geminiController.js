import { sendJson, sessionCookie } from '../core/services.js';async function handleAiChat(context) {
  const fallback = "I can still help: use Posts to browse, Create Post to submit for approval, and Transactions to manage accepted requests.";
  if (!process.env.GEMINI_API_KEY) {
    return sendJson(context.res, 200, { reply: fallback }, { "Set-Cookie": sessionCookie(context.session.id) });
  }
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are LearnLink Assistant for a tutoring platform. User name: ${context.user.name}. Role: ${context.user.role}. Question: ${sanitize(context.body.message)}`
          }]
        }]
      })
    });
    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || fallback;
    return sendJson(context.res, 200, { reply }, { "Set-Cookie": sessionCookie(context.session.id) });
  } catch {
    return sendJson(context.res, 200, { reply: fallback }, { "Set-Cookie": sessionCookie(context.session.id) });
  }
}
export { handleAiChat };
