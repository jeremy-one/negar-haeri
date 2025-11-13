# Configuration du formulaire de contact

Le formulaire de contact utilise **Resend** pour envoyer des emails. C'est simple, gratuit et ne nécessite pas de mot de passe email.

## 1. Créer un compte Resend (GRATUIT)

1. Allez sur https://resend.com
2. Créez un compte gratuit (avec GitHub ou email)
3. Une fois connecté, allez sur https://resend.com/api-keys
4. Cliquez sur **"Create API Key"**
5. Donnez-lui un nom (ex: "Negar Haeri Contact Form")
6. Copiez la clé API (elle commence par `re_`)

**Plan gratuit** : 100 emails/jour (3000/mois) - largement suffisant !

## 2. Configuration locale (.env)

Ouvrez le fichier `.env` et remplacez la clé API :

```env
RESEND_API_KEY=re_votre_cle_api_ici
```

## 3. Configuration sur Vercel (IMPORTANT)

Pour que le formulaire fonctionne en production :

### Étapes :

1. Allez sur https://vercel.com/jeremy-ones-projects/negar-haeri
2. Cliquez sur **Settings** (dans la navigation)
3. Cliquez sur **Environment Variables** (menu de gauche)
4. Ajoutez UNE SEULE variable :

| Variable | Valeur |
|----------|--------|
| `RESEND_API_KEY` | `re_votre_cle_api_resend` |

5. Cliquez sur **Add**
6. Allez dans l'onglet **Deployments**
7. Cliquez sur les **3 points** du dernier déploiement
8. Cliquez sur **Redeploy** pour appliquer les changements

## 3. Test

Une fois configuré, le formulaire :
- Affiche "Envoi en cours..." pendant l'envoi
- Affiche un message de succès (vert) si l'email est envoyé
- Affiche un message d'erreur (rouge) en cas de problème
- Réinitialise le formulaire après succès

Les emails seront envoyés à : **nh@haeri-avocat.com**
