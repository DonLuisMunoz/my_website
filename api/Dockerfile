FROM python:3.12-slim

WORKDIR /app

# install deps first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# SQLite file lives here; mount a volume so data survives restarts
RUN mkdir -p /app/data
ENV DB_PATH=/app/data/portfolio.db

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
