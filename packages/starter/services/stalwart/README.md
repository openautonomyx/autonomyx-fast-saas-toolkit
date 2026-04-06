# Stalwart Mail Server Configuration

## Post-Setup Steps

1. **Access admin**: Stalwart web UI at internal port 8080
2. **Add your domain** and configure DNS records:
   - MX record: `mail.DOMAIN`
   - SPF: `v=spf1 ip4:YOUR_IP include:DOMAIN ~all`
   - DKIM: Generate key pair in Stalwart, add TXT record
   - DMARC: `v=DMARC1; p=quarantine; rua=mailto:admin@DOMAIN`
3. **Create mailboxes** for transactional email (noreply@, support@)
4. **Configure other services** to use Stalwart as SMTP relay

## SMTP Configuration for Other Services

All toolkit services can use Stalwart for sending email:

```
SMTP Host:     stalwart (internal Docker name)
SMTP Port:     25 (internal) or 587 (submission)
SMTP User:     noreply@DOMAIN
SMTP Password: (from SMTP_PASSWORD env var)
```

## Ports Exposed

| Port | Protocol | Purpose |
|---|---|---|
| 25 | SMTP | Server-to-server mail delivery |
| 587 | Submission | Client mail submission (STARTTLS) |
| 993 | IMAPS | Client mailbox access (TLS) |
