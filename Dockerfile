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
    git \
    openblas-dev \
    boost-dev \
    zlib-dev \
    openssl-dev \
    bzip2-dev \
    lz4-dev \
    snappy-dev \
    zstd-dev \
    libressl-dev \
    curl-dev

# Build Arrow C++ from source
ENV ARROW_VERSION=14.0.2
RUN wget https://apache.org/dyn/closer.lua?path=arrow/arrow-${ARROW_VERSION}/apache-arrow-${ARROW_VERSION}.tar.gz -O apache-arrow.tar.gz && \
    tar xf apache-arrow.tar.gz && \
    cd apache-arrow-${ARROW_VERSION} && \
    mkdir build && \
    cd build && \
    cmake ../cpp \
        -DARROW_COMPUTE=ON \
        -DARROW_CSV=ON \
        -DARROW_DATASET=ON \
        -DARROW_FILESYSTEM=ON \
        -DARROW_HDFS=OFF \
        -DARROW_JSON=ON \
        -DARROW_PARQUET=ON \
        -DARROW_WITH_SNAPPY=ON \
        -DARROW_WITH_LZ4=ON \
        -DARROW_WITH_ZLIB=ON \
        -DARROW_WITH_ZSTD=ON \
        -DARROW_WITH_BROTLI=OFF \
        -DARROW_WITH_BZ2=ON \
        -DARROW_PYTHON=ON \
        -DCMAKE_BUILD_TYPE=Release \
        -DCMAKE_INSTALL_PREFIX=/usr \
        -DCMAKE_INSTALL_LIBDIR=lib && \
    make -j$(nproc) && \
    make install && \
    cd ../.. && \
    rm -rf apache-arrow-${ARROW_VERSION} apache-arrow.tar.gz

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
    pip3 install --no-cache-dir \
        numpy \
        packaging \
        pyyaml \
        requests \
        tqdm \
        filelock \
        typing-extensions \
        sympy && \
    # Install PyTorch CPU
    pip3 install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu && \
    # Install remaining packages
    pip3 install --no-cache-dir -r python/requirements.txt

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
RUN apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    musl-dev \
    git \
    openblas-dev \
    zlib \
    lz4-libs \
    snappy \
    zstd-libs \
    bzip2-libs

# Copy Arrow libraries from deps stage
COPY --from=deps /usr/lib/libarrow* /usr/lib/
COPY --from=deps /usr/lib/libparquet* /usr/lib/
COPY --from=deps /usr/lib/cmake/arrow /usr/lib/cmake/arrow
COPY --from=deps /usr/lib/cmake/parquet /usr/lib/cmake/parquet
COPY --from=deps /usr/include/arrow /usr/include/arrow
COPY --from=deps /usr/include/parquet /usr/include/parquet

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

