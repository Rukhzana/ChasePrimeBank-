# Deploy op Vercel

Deze versie is geschikt voor Vercel.

## Wat Vercel gebruikt

- `index.html`, `style.css`, `script.js`, `logo.svg` voor de website
- `api/appointments.js` voor afspraken, MySQL en bevestigingsmail
- `api/health.js` om te testen of de API werkt
- `package.json` voor de Vercel dependencies

## Vercel instellingen

Bij het importeren van de GitHub repo:

- Framework Preset: `Other`
- Root Directory: leeg laten
- Build Command: leeg laten of default laten
- Output Directory: leeg laten

## Environment Variables

Vul deze in bij Vercel:

```env
DB_HOST=your_mysql_host
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=chase_prime_bank
DB_SSL=false
EMAIL_USER=chaseprimebank@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=Chase Prime Bank <chaseprimebank@gmail.com>
ADMIN_EMAIL=chaseprimebank@gmail.com
```

Gebruik `DB_SSL=true` als jouw MySQL provider SSL verplicht.

## Aanbevolen: Resend voor e-mail

Als Gmail App Password niet werkt, gebruik Resend. Voeg dit toe in Vercel:

```env
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=Chase Prime Bank <onboarding@resend.dev>
ADMIN_EMAIL=chaseprimebank@gmail.com
```

Met het gratis Resend testadres kun je eerst versturen vanaf `onboarding@resend.dev`. Later kun je een eigen domein verifiëren.

## Als Gmail App Password niet werkt

Gebruik dan een SMTP-dienst zoals Brevo. Voeg deze variabelen toe in Vercel:

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_brevo_smtp_login
SMTP_PASS=your_brevo_smtp_key
EMAIL_FROM=Chase Prime Bank <chaseprimebank@gmail.com>
ADMIN_EMAIL=chaseprimebank@gmail.com
```

Als `SMTP_HOST` is ingevuld, gebruikt de website SMTP in plaats van Gmail App Password.

## Database

Maak de tabel aan met:

```bash
mysql -u USER -p -h HOST DB_NAME < backend/schema.sql
```

Of plak de inhoud van `backend/schema.sql` in het SQL-scherm van je MySQL provider.

## Testen

Na deploy kun je testen:

```text
https://jouw-vercel-link.vercel.app/api/health
```

Als je `{ "ok": true }` ziet, draait de API.
