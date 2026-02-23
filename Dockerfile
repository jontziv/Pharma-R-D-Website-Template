# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package.json ./

# Install dependencies (includes peer deps React/React-DOM)
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Build args for Supabase env (injected at build time by HF Secrets or CI)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Production build
RUN npm run build

# ─── Stage 2: Serve ───────────────────────────────────────────────────────────
FROM nginx:1.25-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/pharmalab.conf

# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

# HuggingFace Spaces requires port 7860
EXPOSE 7860

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
