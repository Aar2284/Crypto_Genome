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

WebSocket Producers (Binance, KuCoin, Gate.io) → Kafka → Consumer → PostgreSQL (Assets & History) → FastAPI Backend → React Frontend

---

## ⚙️ How the Pipeline Works

### 🔹 1. Data Ingestion (Kafka & WebSockets)

![Kafka](https://img.shields.io/badge/Kafka-Producer/Consumer-black?logo=apachekafka)

- Four independent websocket producers fetch real-time tick data (Binance, KuCoin, Gate.io, Bitfinex)
- Kafka acts as a high-throughput message broker
- Consumer reads and processes the unified stream

👉 Production-grade real-time streaming

---

### 🔹 2. Data Processing & API

![Python](https://img.shields.io/badge/Python-FastAPI-blue?logo=fastapi)

- Consumer transforms incoming data, calculates metrics, and handles database failovers
- FastAPI backend provides a RESTful and WebSocket API layer for the frontend
- Validates data streams on the fly

---

### 🔹 3. Data Storage (PostgreSQL)

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Data%20Warehouse-blue?logo=postgresql)

- Data is upserted into `assets` (real-time snapshot) and `asset_history` (time-series ticks)
- Pre-calculated quantitative datasets loaded into `coin_ohlcv` and genome tables
- Structured storage for ultra-fast frontend querying

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

Total rows in asset_history: 1400+ (streaming live)

👉 Confirms successful pipeline execution

---

## 🐳 Infrastructure (Docker)

![Docker](https://img.shields.io/badge/Docker-Containers-blue?logo=docker)

All core data infrastructure runs in containers:

- Kafka (KRaft mode)
- PostgreSQL
- Airflow (webserver + scheduler)

👉 No local installations required

---

## 📂 Project Structure

```text
backend/
│
├── core/, database/, models/, routers/, schemas/, services/ (FastAPI Application)
├── Pipelining/
│   ├── Airflow/
│   │   ├── dags/crypto_pipeline_dag.py
│   │   └── docker-compose.yml
│   ├── Ingestion/
│   │   ├── kafka_producer_binance.py
│   │   ├── kafka_producer_kucoin.py
│   │   ├── kafka_producer_gate.py
│   │   ├── kafka_consumer.py
│   └── docker-compose.yml (Kafka + Postgres)
├── start_pipeline.ps1
└── requirements.txt

crypto-genome-frontend/ (React UI)
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

### 🔹 3. Start Data Infrastructure (Kafka & PostgreSQL)

Move into the Pipelining folder:

```bash
cd Pipelining
docker compose up -d
```

Verify containers (`kafka-kraft` and `crypto_postgres`) are running:

```bash
docker ps
```

---

### 🔹 4. Start the Data Pipeline

Run the PowerShell script from the `backend/` directory to launch the Kafka Consumer and all WebSocket Producers in the background:

```powershell
.\start_pipeline.ps1
```

---

### 🔹 5. Start the FastAPI Server

From the `backend/` directory:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

### 🔹 6. Start Airflow Infrastructure

Move into Airflow folder:

```bash
cd Pipelining/Airflow
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

### 🔹 7. Create Airflow Admin User (First Time Setup)

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

### 🔹 8. Verify Running Containers

```bash
docker ps
```

Expected containers:

```text
airflow-webserver-1
airflow-scheduler-1
airflow-postgres-1
kafka-kraft
crypto_postgres
```

---

### 🔹 9. Open Airflow UI

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

### 🔹 10. Trigger the DAG

Inside Airflow UI:

- Enable DAG
- Click ▶ Run
- Open Graph View

Pipeline execution order:

```text
run_producer → run_consumer → run_loader → validate_data
```

---

### 🔹 11. Validate Final Output

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

### 🔹 12. Verify Data in PostgreSQL

Open PostgreSQL container:

```bash
docker exec -it crypto_postgres psql -U postgres -d crypto_genome
```

Show tables:

```sql
\dt
```

Check inserted rows (streaming data):

```sql
SELECT COUNT(*) FROM asset_history;
```

Sample output:

```text
1413
```

---

## 🛑 Proper Shutdown Procedure

### Stop Airflow

```bash
cd backend/Pipelining/Airflow
docker compose down
```

---

### Stop Data Infrastructure (Kafka & Postgres)

```bash
cd backend/Pipelining
docker compose down
```

---

### Stop Python Processes

Close the terminal running `uvicorn` and kill the background Python processes launched by `start_pipeline.ps1`.

---

## 🔄 Restart Procedure

### Start Data Infrastructure (Kafka & Postgres)

```bash
cd backend/Pipelining
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
SELECT * FROM asset_history ORDER BY timestamp DESC LIMIT 5;
```

---

## 🧰 Tech Stack (by Role)

### 🟦 API & Processing
- FastAPI
- websockets
- pandas
- numpy

### 🟧 Quantitative Models
- scikit-learn
- joblib

### 🟩 Streaming
- kafka-python
- aiohttp

### 🟥 Database
- SQLAlchemy
- asyncpg / psycopg2
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

- Integrate advanced machine learning predictions
- Expand to non-crypto markets
- Add automated alerting system
- Deploy on cloud (AWS/GCP)

## 🛑 Troubleshooting

### Ports Already in Use
If you encounter errors about ports 8000, 5432, or 8080 being in use, ensure no other services are running on those ports. You can change port mappings in `docker-compose.yml` if necessary.

### Kafka Connection Refused
If the producer scripts cannot connect to Kafka, wait a few more seconds for the Kafka broker to fully start up and elect a KRaft leader.

---

## 👨‍💻 Author

Aaryan Kalia
