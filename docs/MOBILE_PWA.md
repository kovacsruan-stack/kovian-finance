# KOVIAN Finance Mobile/PWA

O domínio Finance possui uma superfície PWA independente em `/app/`.

## Instalação

1. Publique o backend com HTTPS.
2. Abra `/app/` no navegador móvel.
3. No iPhone use Compartilhar → Adicionar à Tela de Início.
4. Em Android use o prompt de instalação quando disponível.

O manifest usa `display: standalone`, escopo isolado e service worker dedicado. A tela também valida `/actuator/health` para confirmar conectividade com a API.
