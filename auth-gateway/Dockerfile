FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Generate JWT keys if they don't exist
RUN python src/config/keys/generate_keys.py || true

# Expose port
EXPOSE 9000

# Run application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "9000"]
