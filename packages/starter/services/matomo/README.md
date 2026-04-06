# Matomo Web Analytics Configuration

## Post-Setup Steps

1. **Access Matomo**: https://analytics.DOMAIN
2. **Complete setup wizard** (auto-detects MariaDB)
3. **Add your first website**: app.DOMAIN
4. **Copy tracking code** to your application
5. **Configure goals**: Signups, upgrades, API key creation

## Tracking Code

```html
<!-- Matomo Tag -->
<script>
  var _paq = window._paq = window._paq || [];
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);
  (function() {
    var u="https://analytics.YOUR_DOMAIN/";
    _paq.push(['setTrackerUrl', u+'matomo.php']);
    _paq.push(['setSiteId', '1']);
    var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
    g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
  })();
</script>
```

## Multi-Tenant Tracking

Use custom dimensions to segment analytics by tenant:

```javascript
// Set tenant context on each page view
_paq.push(['setCustomDimension', 1, tenantId]);
_paq.push(['setCustomDimension', 2, tenantPlan]);
```

## Why Its Own MariaDB

Matomo only supports MySQL/MariaDB — not PostgreSQL. The toolkit gives it
a dedicated MariaDB container (`matomo-db`) to avoid polluting the shared
PostgreSQL instance. This adds ~50MB RAM overhead.
