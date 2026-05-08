# 🚀 Crypto Genome Data Pipeline

![Python](https://img.shields.io/badge/Python-FFD43B.svg?style=for-the-badge&logo=Python&logoColor=white)
![Kafka](https://img.shields.io/badge/Apache%20Kafka-231F20.svg?style=for-the-badge&logo=Apache-Kafka&logoColor=white)
![Apache Airflow](https://img.shields.io/badge/Apache%20Airflow-B22222.svg?style=for-the-badge&logo=Apache-Airflow&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1.svg?style=for-the-badge&logo=PostgreSQL&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED.svg?style=for-the-badge&logo=Docker&logoColor=white)

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

## ▶️ Complete Setup & Execution

### 🔹 1. Clone Repository

```bash
git clone https://github.com/Aar2284/Crypto_Genome.git
cd Crypto_Genome/backend
```

---

### 🔹 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

---

### 🔹 3. Start PostgreSQL Database

```bash
docker start postgres-db
```

Verify:

```bash
docker ps
```

---

### 🔹 4. Start Kafka Infrastructure

Move into ingestion folder:

```bash
cd Pipelining/Ingestion
```

Start Kafka container:

```bash
docker compose up -d
```

Verify Kafka is running:

```bash
docker ps
```

You should see:

```text
kafka-kraft
```

---

### 🔹 5. Start Airflow Infrastructure

Move into Airflow folder:

```bash
cd ../Airflow
```

Start Airflow services:

```bash
docker compose up -d
```

This starts:

- Airflow Webserver
- Airflow Scheduler
- Airflow PostgreSQL Metadata DB

---

### 🔹 6. Create Airflow Admin User (First Time Setup)

Run this command after Airflow containers are running:

```bash
docker exec -it airflow-airflow-webserver-1 airflow users create \
--username admin \
--firstname Admin \
--lastname User \
--role Admin \
--email admin@example.com \
--password admin
```

PowerShell version:

```powershell
docker exec -it airflow-airflow-webserver-1 airflow users create `
--username admin `
--firstname Admin `
--lastname User `
--role Admin `
--email admin@example.com `
--password admin
```

---

### 🔹 7. Verify Running Containers

```bash
docker ps
```

Expected containers:

```text
airflow-webserver-1
airflow-scheduler-1
airflow-postgres-1
kafka-kraft
postgres-db
```

---

### 🔹 8. Open Airflow UI

```text
http://localhost:8080
```

Login using the credentials created in previous step.

Example:

```text
Username: admin
Password: admin
```

---

### 🔹 9. Trigger the DAG

Inside Airflow UI:

- Enable DAG
- Click ▶ Run
- Open Graph View

Pipeline execution order:

```text
run_producer → run_consumer → run_loader → validate_data
```

---

### 🔹 10. Validate Final Output

Open:

```text
validate_data → Logs
```

Expected output:

```text
Checking data in PostgreSQL...
Total rows in DB: 190
```

---

### 🔹 11. Verify Data in PostgreSQL

Open PostgreSQL container:

```bash
docker exec -it postgres-db psql -U admin -d crypto
```

Show tables:

```sql
\dt
```

Check inserted rows:

```sql
SELECT COUNT(*) FROM crypto_stream;
```

Sample output:

```text
190
```

---

## 🛑 Proper Shutdown Procedure

### Stop Airflow

```bash
cd backend/Pipelining/Airflow
docker compose down
```

---

### Stop Kafka

```bash
cd ../Ingestion
docker compose down
```

---

### Stop PostgreSQL

```bash
docker stop postgres-db
```

---

## 🔄 Restart Procedure

### Start PostgreSQL

```bash
docker start postgres-db
```

### Start Kafka

```bash
cd backend/Pipelining/Ingestion
docker compose up -d
```

### Start Airflow

```bash
cd ../Airflow
docker compose up -d
```

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
