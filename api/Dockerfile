FROM python:3.12-slim

# uv instead of pip: same result, much faster installs, and the version is
# pinned here so a rebuild six months from now behaves the same.
COPY --from=ghcr.io/astral-sh/uv:0.5.11 /uv /bin/uv

WORKDIR /app

# Dependencies first, in their own layer, so editing main.py doesn't reinstall
# them. pyproject.toml is the only dependency list in the project.
COPY pyproject.toml .
RUN uv pip install --system --no-cache -r pyproject.toml

COPY main.py .

# SQLite file lives here; the compose file mounts a volume so it survives rebuilds
RUN mkdir -p /app/data
ENV DB_PATH=/app/data/portfolio.db

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
