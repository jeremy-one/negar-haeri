# Configuration du formulaire de contact

Le formulaire de contact utilise Nodemailer pour envoyer des emails via le serveur SMTP Gandi.

## 1. Configuration locale (.env)

Le fichier `.env` est déjà pré-configuré avec les paramètres Gandi. Il vous suffit de remplacer le mot de passe :

```env
SMTP_HOST=mail.gandi.net
SMTP_PORT=587
SMTP_USER=nh@haeri-avocat.com
SMTP_PASS=VOTRE_MOT_DE_PASSE_ICI
```

Le mot de passe est celui qui a été défini lors de la création du compte email sur Gandi.

## 2. Configuration sur Vercel (IMPORTANT)

Pour que le formulaire fonctionne en production, vous **DEVEZ** configurer les variables d'environnement sur Vercel :

### Étapes :

1. Allez sur https://vercel.com/jeremy-ones-projects/negar-haeri
2. Cliquez sur **Settings** (dans la navigation)
3. Cliquez sur **Environment Variables** (menu de gauche)
4. Ajoutez ces 4 variables **exactement comme ci-dessous** :

| Variable | Valeur |
|----------|--------|
| `SMTP_HOST` | `mail.gandi.net` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `nh@haeri-avocat.com` |
| `SMTP_PASS` | Le mot de passe du compte email Gandi |

5. Pour chaque variable, cliquez sur **Add** après l'avoir saisie
6. Une fois les 4 variables ajoutées, allez dans l'onglet **Deployments**
7. Cliquez sur les **3 points** du dernier déploiement
8. Cliquez sur **Redeploy** pour appliquer les changements

## 3. Paramètres Gandi (pour référence)

```
Serveur SMTP : mail.gandi.net
Port : 587 (STARTTLS)
TLS/SSL : Oui
Nom d'utilisateur : nh@haeri-avocat.com
Mot de passe : celui défini à la création
```

## 3. Test

Une fois configuré, le formulaire :
- Affiche "Envoi en cours..." pendant l'envoi
- Affiche un message de succès (vert) si l'email est envoyé
- Affiche un message d'erreur (rouge) en cas de problème
- Réinitialise le formulaire après succès

Les emails seront envoyés à : **nh@haeri-avocat.com**
