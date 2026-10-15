#!/bin/sh
# Run with: sh deploy/init-env.sh (Linux VPS, from site/).
set -eu
cd "$(dirname "$0")/.."
if [ -e .env ] || [ -L .env ]; then
  echo 'Un fichier .env existe deja : aucun changement. Conservez vos secrets et modifiez seulement les options necessaires.' >&2
  exit 1
fi
command -v openssl >/dev/null 2>&1 || { echo 'Installez openssl avant de continuer.' >&2; exit 1; }
printf 'Domaine sans https:// [spicy-drc.tech] : '
read -r domain
domain=${domain:-spicy-drc.tech}
case "$domain" in
  *[!a-zA-Z0-9.-]*|.*|*..*|*.) echo 'Domaine invalide.' >&2; exit 1 ;;
esac
case "$domain" in *.*) ;; *) echo 'Utilisez un nom de domaine complet.' >&2; exit 1 ;; esac
printf 'Reseau Docker de routage [traefik-public] : '
read -r network
network=${network:-traefik-public}
case "$network" in *[!a-zA-Z0-9_.-]*) echo 'Nom de reseau invalide.' >&2; exit 1 ;; esac
db_secret=$(openssl rand -hex 32)
jwt_secret=$(openssl rand -hex 48)
umask 077
# noclobber also protects against a concurrent run creating .env.
set -C
cat > .env <<EOF
COMPOSE_PROJECT_NAME=spicy-v2
SPICY_DOMAIN=$domain
APP_ORIGINS=https://$domain
TRAEFIK_NETWORK=$network
SPICY_IMAGE_TAG=v2.2.0
POSTGRES_DB=spicy
POSTGRES_USER=spicy
POSTGRES_PASSWORD=$db_secret
JWT_SECRET=$jwt_secret
EOF
echo '.env cree avec des secrets uniques. Sauvegardez-le dans un emplacement prive. Aucun mot de passe administrateur cree.'
