import type { APIRoute } from 'astro';
import { Resend } from 'resend';

// Rate limiting en mémoire (simple, se reset au redémarrage)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // max 10 requêtes
const RATE_WINDOW = 60 * 1000; // par minute

// Fonction pour vérifier le rate limit
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// Fonction pour détecter le spam dans le message
function isSpamMessage(message: string): boolean {
  const messageStr = String(message);

  // Compter les URLs
  const urlPattern = /https?:\/\/[^\s]+/gi;
  const urls = messageStr.match(urlPattern) || [];
  if (urls.length > 3) {
    console.log('Spam détecté: trop d\'URLs (' + urls.length + ')');
    return true;
  }

  // Détecter le code HTML/JS suspect
  const suspiciousPatterns = [
    /<script/i,
    /<iframe/i,
    /javascript:/i,
    /onclick=/i,
    /onerror=/i,
    /<form/i,
    /<input/i,
    /eval\(/i,
    /document\./i,
    /window\./i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(messageStr)) {
      console.log('Spam détecté: code suspect');
      return true;
    }
  }

  return false;
}

// Réponse fake pour les bots (ne pas les alerter)
const fakeSuccessResponse = () => new Response(
  JSON.stringify({ success: true, message: 'Email envoyé avec succès' }),
  { status: 200, headers: { 'Content-Type': 'application/json' } }
);

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    // Récupérer l'IP (Vercel fournit clientAddress)
    const ip = clientAddress || request.headers.get('x-forwarded-for') || 'unknown';

    // === PROTECTION 1: User-Agent vide ===
    const userAgent = request.headers.get('user-agent');
    if (!userAgent || userAgent.trim() === '') {
      console.log('Bot détecté: User-Agent vide, IP:', ip);
      return fakeSuccessResponse();
    }

    // === PROTECTION 2: Rate Limit ===
    if (!checkRateLimit(ip)) {
      console.log('Rate limit dépassé pour IP:', ip);
      return fakeSuccessResponse();
    }

    const data = await request.formData();
    const name = data.get('name');
    const email = data.get('email');
    const subject = data.get('subject');
    const message = data.get('message');
    const honeypot = data.get('website'); // Honeypot field
    const formTimestamp = data.get('_timestamp'); // Timestamp du formulaire

    // === PROTECTION 3: Honeypot (existante) ===
    if (honeypot) {
      console.log('Bot détecté via honeypot, IP:', ip);
      return fakeSuccessResponse();
    }

    // === PROTECTION 4: Timestamp (minimum 3 secondes) ===
    if (formTimestamp) {
      const submitTime = Date.now();
      const loadTime = parseInt(String(formTimestamp), 10);
      const timeDiff = submitTime - loadTime;

      if (timeDiff < 3000) { // Moins de 3 secondes
        console.log('Bot détecté: soumission trop rapide (' + timeDiff + 'ms), IP:', ip);
        return fakeSuccessResponse();
      }
    }

    // Validation des champs requis
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Tous les champs sont requis' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // === PROTECTION 5: Contenu spam (URLs, code malveillant) ===
    if (isSpamMessage(String(message))) {
      console.log('Spam détecté dans le message, IP:', ip);
      return fakeSuccessResponse();
    }

    // ========================================
    // ENVOI EMAIL - LOGIQUE ORIGINALE INTACTE
    // ========================================
    const resend = new Resend(import.meta.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: 'Contact Site Web <contact@haeri-avocat.com>',
      to: 'nh@haeri-avocat.com',
      replyTo: email as string,
      subject: \`Contact depuis le site web: \${subject}\`,
      html: \`
        <h2>Nouveau message de contact</h2>
        <p><strong>Nom:</strong> \${name}</p>
        <p><strong>Email:</strong> \${email}</p>
        <p><strong>Sujet:</strong> \${subject}</p>
        <p><strong>Message:</strong></p>
        <p>\${message}</p>
      \`,
    });

    if (result.error) {
      console.error('Erreur Resend:', result.error);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de l\'envoi de l\'email' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email envoyé avec succès' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur lors de l\'envoi de l\'email' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
