import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.formData();
    const name = data.get('name');
    const email = data.get('email');
    const subject = data.get('subject');
    const message = data.get('message');

    // Validation
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Tous les champs sont requis' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialiser Resend avec la clé API
    const resend = new Resend(import.meta.env.RESEND_API_KEY);

    // Envoi de l'email via Resend
    const result = await resend.emails.send({
      from: 'Contact Site Web <onboarding@resend.dev>', // Adresse par défaut de Resend (gratuite)
      to: 'nh@haeri-avocat.com',
      replyTo: email as string,
      subject: `Contact depuis le site web: ${subject}`,
      html: `
        <h2>Nouveau message de contact</h2>
        <p><strong>Nom:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Sujet:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
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
