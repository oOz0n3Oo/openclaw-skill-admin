FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5057 \
    OPENCLAW_WORKSPACE=/data/openclaw-workspace \
    CLAWHUB_BIN=/usr/local/bin/clawhub

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends nodejs ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN ln -s /app/vendor/clawhub/bin/clawdhub.js /usr/local/bin/clawhub \
    && chmod +x /app/vendor/clawhub/bin/clawdhub.js

EXPOSE 5057

CMD ["python", "app.py"]
