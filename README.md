# 🚀 Crypto Genome Data Pipeline

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![Kafka](https://img.shields.io/badge/Apache%20Kafka-Streaming-black?logo=apachekafka)
![Airflow](https://img.shields.io/badge/Apache%20Airflow-Orchestration-red?logo=apacheairflow)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Containerized-blue?logo=docker)

---

## 📌 Overview

This project is an **end-to-end data pipeline** that simulates crypto data ingestion, processes it, and stores it for analysis.

It demonstrates:

- Data ingestion using Kafka
- Workflow orchestration using Airflow
- Data storage in PostgreSQL
- Fully automated pipeline execution

---

## 🧠 Architecture

Producer → Kafka → Consumer → CSV → PostgreSQL → Airflow Orchestration

---

## ⚙️ How the Pipeline Works

### 🔹 1. Data Ingestion (Kafka)

![Kafka](https://img.shields.io/badge/Kafka-Producer/Consumer-black?logo=apachekafka)

- Producer sends crypto data
- Kafka acts as a message broker
- Consumer reads and processes the stream

👉 Simulates real-time streaming

---

### 🔹 2. Data Processing

![Python](https://img.shields.io/badge/Python-Processing-blue?logo=python)

- Consumer transforms incoming data
- Stores processed data into a CSV file
- Acts as intermediate storage layer

---

### 🔹 3. Data Storage (PostgreSQL)

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Data%20Warehouse-blue?logo=postgresql)

- Data is inserted into PostgreSQL
- Structured storage for querying
- Enables analysis and validation

---

### 🔹 4. Workflow Orchestration (Airflow)

![Airflow](https://img.shields.io/badge/Airflow-Orchestration-red?logo=apacheairflow)

Airflow manages the pipeline as a DAG:

run_producer → run_consumer → run_loader → validate_data

- Ensures correct execution order
- Handles automation
- Provides monitoring via UI

---

### 🔹 5. Data Validation (Final Output)

- Final task checks data in PostgreSQL
- Displays:

Total rows in DB: 190

👉 Confirms successful pipeline execution

---

## 🐳 Infrastructure (Docker)

![Docker](https://img.shields.io/badge/Docker-Containers-blue?logo=docker)

All services run in containers:

- Kafka (KRaft mode)
- PostgreSQL
- Airflow (webserver + scheduler)

👉 No local installations required

---

## 📂 Project Structure

```
backend/
│
├── Ingestion/
│   ├── kafka_producer.py
│   ├── kafka_consumer.py
│
├── Warehouse/
│   ├── load_to_postgres.py
│
├── Pipelining/
│   ├── Airflow/
│   │   ├── dags/
│   │   │   └── crypto_pipeline_dag.py
│   │   ├── docker-compose.yml
│   │
│   ├── Ingestion/
│   │   └── docker-compose.yml
│
├── requirements.txt
```

---

## ▶️ How to Run

### 1. Start Infrastructure

```bash
docker compose up -d
```

### 2. Open Airflow UI

http://localhost:8080

### 3. Trigger Pipeline

- Enable DAG  
- Click ▶ Run  

### 4. View Output

- Open validate_data task logs  
- See:

Total rows in DB: XXX

---

## 📊 Sample Query

```sql
SELECT * FROM crypto_stream LIMIT 5;
```

---

## 🧰 Tech Stack (by Role)

### 🟦 Data Processing
- pandas
- numpy

### 🟧 Machine Learning (future scope)
- scikit-learn
- joblib

### 🟩 Streaming
- kafka-python

### 🟥 Database
- psycopg2
- PostgreSQL (Docker)

### 🟪 Orchestration
- Apache Airflow (Docker)

### ⚫ Infrastructure
- Docker

---

## 💡 Key Highlights

- End-to-end pipeline (ingestion → storage)
- Fully automated via Airflow
- Containerized architecture
- Clean separation of concerns
- Real-world data engineering tools

---

## 🚀 Future Improvements

- Add real-time API ingestion
- Build dashboard (Streamlit / React)
- Add data validation layer
- Deploy on cloud (AWS/GCP)

---

## 👨‍💻 Author

Aaryan Kalia
