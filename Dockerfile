# 1. Etap budowania (builder) - instalacja zależności
FROM node:20-alpine AS builder

# Katalog roboczy
WORKDIR /app

# Optymalizacja funkcjonowania cachy
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./


# 2. Etap - uruchomienie aplikacji
FROM node:20-alpine

# Wymuszenie aktualizacji npm do najnowszej wersji, aby załatać wbudowane podatności
RUN npm install -g npm@latest

# OCI 
LABEL org.opencontainers.image.authors="Kinga Kowalska"
LABEL org.opencontainers.image.title="Aplikacja Pogodowa"

WORKDIR /app

# Utworzenie bezpiecznego użytkownika i grupy
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder --chown=appuser:appgroup /app /app

# Przełączenie na bezpiecznego użytkownika
USER appuser

# Port, na którym nasłuchuje aplikacja
EXPOSE 8080

# Healthcheck - sprawdzanie czy aplikacja odpowiada
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Uruchomienie aplikacji
CMD ["node", "server.js"]
