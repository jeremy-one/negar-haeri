# Configuration du formulaire de contact

Le formulaire de contact utilise Nodemailer pour envoyer des emails. Voici comment le configurer :

## 1. Configuration locale (.env)

Le fichier `.env` contient déjà la structure. Remplacez les valeurs par vos vraies credentials SMTP :

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-application
```

### Pour Gmail :

1. Allez sur https://myaccount.google.com/apppasswords
2. Créez un mot de passe d'application
3. Utilisez ce mot de passe dans `SMTP_PASS`

### Pour OVH :
```env
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=587
SMTP_USER=contact@votre-domaine.com
SMTP_PASS=votre-mot-de-passe
```

## 2. Configuration sur Vercel

Sur Vercel, vous devez configurer les variables d'environnement :

1. Allez sur votre projet Vercel
2. Settings > Environment Variables
3. Ajoutez les 4 variables :
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
4. Redéployez le projet

## 3. Test

Une fois configuré, le formulaire :
- Affiche "Envoi en cours..." pendant l'envoi
- Affiche un message de succès (vert) si l'email est envoyé
- Affiche un message d'erreur (rouge) en cas de problème
- Réinitialise le formulaire après succès

Les emails seront envoyés à : **nh@haeri-avocat.com**
