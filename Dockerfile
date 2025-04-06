FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    gcc \
    python3-dev \
    musl-dev \
    linux-headers \
    build-base \
    cmake \
    git

# Create and activate virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Install Python dependencies in virtual environment
COPY python/requirements.txt ./python/
RUN . /opt/venv/bin/activate && \
    pip3 install --upgrade pip && \
    pip3 install --no-cache-dir setuptools wheel && \
    # Install base dependencies first
    pip3 install --no-cache-dir numpy packaging pyyaml requests tqdm filelock typing-extensions sympy && \
    # Then install PyTorch and related packages
    pip3 install --no-cache-dir torch==2.2.0+cpu -f https://download.pytorch.org/whl/cpu && \
    # Finally install the rest with --no-deps to avoid conflicts
    pip3 install --no-cache-dir --no-deps -r python/requirements.txt

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install Python and create virtual environment
RUN apk add --no-cache python3 py3-pip python3-dev musl-dev git

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy virtual environment from deps stage
COPY --from=deps /opt/venv /opt/venv

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/python ./python

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]

