# Mautic Email Marketing Configuration

## Post-Setup Steps

1. **Access Mautic**: https://email.DOMAIN
2. **Log in** with ADMIN_EMAIL and MAUTIC_ADMIN_PASSWORD
3. **Configure SMTP**: Settings → Email → SMTP
   - Host: `stalwart` | Port: `25` | Encryption: None (internal)
4. **Create segments**: e.g., "Trial Users", "Pro Plan", "Churned"
5. **Build campaigns**: Welcome series, feature announcements, re-engagement
6. **Add tracking**: Insert Mautic tracking JS in your app

## Tracking Code

```html
<!-- Add to your app's HTML -->
<script>
  (function(w,d,t,u,n,a,m){w['MauticTrackingObject']=n;
    w[n]=w[n]||function(){(w[n].q=w[n].q||[]).push(arguments)};
    a=d.createElement(t);m=d.getElementsByTagName(t)[0];
    a.async=1;a.src=u;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://email.YOUR_DOMAIN/mtc.js','mt');
  mt('send', 'pageview');
</script>
```

## Integration with Tenant System

Mautic contacts can be tagged with `tenant_id` to segment by workspace:

```
Contact Custom Fields:
  - tenant_id (text, hidden)
  - plan (select: free, starter, pro, enterprise)
  - signup_date (date)
```
