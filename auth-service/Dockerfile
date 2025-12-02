FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (for cryptography and sqlite)
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create directory for SQLite database
RUN mkdir -p /app/data

# Generate JWT keys if they don't exist
RUN python src/config/keys/generate_keys.py || true

# Expose port
EXPOSE 9000

# Run application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "9000"]
