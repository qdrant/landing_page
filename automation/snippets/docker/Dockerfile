FROM ubuntu:24.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    software-properties-common \
    # for rust client
    gcc \
    libc6-dev \
    # for go client
    golang \
    # for java client
    openjdk-21-jdk-headless \
    # for python client
    python3 \
    # for typescript client
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# for csharp client
RUN add-apt-repository ppa:dotnet/backports && \
    apt-get update && \
    apt-get install -y dotnet-sdk-8.0 --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# for rust client
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | \
     CARGO_HOME=/opt/rust RUSTUP_HOME=/opt/rust \
     sh -s -- -y --default-toolchain 1.91.0 

# for typescript client
RUN npm install --global --prefix /usr/local pnpm

# for python client
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Caches go in /workspace/cache
ENV CARGO_HOME=/workspace/cache/cargo \
    npm_config_cache=/workspace/cache/npm \
    GRADLE_USER_HOME=/workspace/cache/gradle \
    NUGET_PACKAGES=/workspace/cache/nuget \
    XDG_CACHE_HOME=/workspace/cache/xdg \
    GOPATH=/workspace/cache/go \
    HISTFILE=/workspace/cache/.bash_history \
    HOME=/workspace/cache/home \
    RUSTUP_HOME=/opt/rust \
    PATH="/opt/rust/bin:${PATH}"

WORKDIR /workspace
