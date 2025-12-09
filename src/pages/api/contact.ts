import type { APIRoute } from 'astro';
import { Resend } from 'resend';

// Store pour le rate limiting (en memoire)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Configuration
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 1000;
const MIN_SUBMIT_TIME = 3000;

// Patterns suspects
const SUSPICIOUS_PATTERNS = [
  /(?:https?:\/\/[^\s]+\s*){3,}/gi,
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b.*\b(FROM|INTO|WHERE|TABLE)\b)/gi,
  /[\x00-\x08\x0B\x0C\x0E-\x1F]/g,
  /&#x?[0-9a-f]+;/gi,
  /\x[0-9a-f]{2}/gi,
];

// Pas de liste noire de mots-cles - contexte cabinet d'avocats
// Les clients peuvent legitimement parler de crypto, casino, etc.

function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP;
  return 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  if (record.count >= RATE_LIMIT_MAX) return { allowed: false, remaining: 0 };
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}

function containsSuspiciousContent(text: string): { suspicious: boolean; reason?: string } {
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) return { suspicious: true, reason: 'Contenu suspect detecte' };
  }
  const urlCount = (text.match(/https?:\/\/[^\s]+/gi) || []).length;
  if (urlCount > 2) return { suspicious: true, reason: "Trop d'URLs dans le message" };
  return { suspicious: false };
}

function sanitizeInput(input: string): string {
  return input.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').trim();
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const userAgent = request.headers.get('user-agent');
    if (!userAgent || userAgent.trim() === '') {
      console.log('Bot detecte: User-Agent vide');
      return new Response(JSON.stringify({ success: true, message: 'Email envoye avec succes' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      console.log(`Rate limit depasse pour IP: ${clientIP}`);
      return new Response(JSON.stringify({ error: 'Trop de requetes. Veuillez reessayer dans une minute.' }), { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } });
    }

    const data = await request.formData();
    const name = data.get('name');
    const email = data.get('email');
    const subject = data.get('subject');
    const message = data.get('message');
    const honeypot = data.get('website');
    const timestamp = data.get('_timestamp');

    if (honeypot) {
      console.log('Bot detecte via honeypot');
      return new Response(JSON.stringify({ success: true, message: 'Email envoye avec succes' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (timestamp) {
      const submitTime = parseInt(timestamp.toString(), 10);
      const elapsed = Date.now() - submitTime;
      if (elapsed < MIN_SUBMIT_TIME) {
        console.log(`Bot detecte: formulaire soumis trop rapidement (${elapsed}ms)`);
        return new Response(JSON.stringify({ success: true, message: 'Email envoye avec succes' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ error: 'Tous les champs sont requis' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const fieldsToCheck = [{ name: 'name', value: name.toString() }, { name: 'subject', value: subject.toString() }, { name: 'message', value: message.toString() }];
    for (const field of fieldsToCheck) {
      const check = containsSuspiciousContent(field.value);
      if (check.suspicious) {
        console.log(`Contenu suspect dans ${field.name}: ${check.reason}`);
        return new Response(JSON.stringify({ error: 'Votre message contient du contenu non autorise.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }

    const safeName = sanitizeInput(name.toString());
    const safeEmail = sanitizeInput(email.toString());
    const safeSubject = sanitizeInput(subject.toString());
    const safeMessage = sanitizeInput(message.toString());

    const resend = new Resend(import.meta.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: 'Contact Site Web <contact@haeri-avocat.com>',
      to: 'nh@haeri-avocat.com',
      replyTo: safeEmail,
      subject: `Contact depuis le site web: ${safeSubject}`,
      html: `<h2>Nouveau message de contact</h2><p><strong>Nom:</strong> ${safeName}</p><p><strong>Email:</strong> ${safeEmail}</p><p><strong>Sujet:</strong> ${safeSubject}</p><p><strong>Message:</strong></p><p>${safeMessage}</p><hr><p style="font-size: 12px; color: #666;">IP: ${clientIP}</p>`,
    });

    if (result.error) {
      console.error('Erreur Resend:', result.error);
      return new Response(JSON.stringify({ error: "Erreur lors de l'envoi de l'email" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, message: 'Email envoye avec succes' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    return new Response(JSON.stringify({ error: "Erreur lors de l'envoi de l'email" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
