FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Port 7860 is required by Hugging Face Spaces
EXPOSE 7860

CMD ["python", "app.py"]
