FROM mysql:8

# Copy init scripts that run on first container start (fresh data dir)
COPY init/ /docker-entrypoint-initdb.d/

# Make init scripts executable (ignore if no *.sh present)
RUN chmod +x /docker-entrypoint-initdb.d/*.sh || true