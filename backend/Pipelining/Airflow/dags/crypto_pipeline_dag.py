from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime
import subprocess

def run_producer():
    print("Producer started...")
    subprocess.run(["python", "/opt/airflow/project/Ingestion/kafka_producer.py"])
    print("Data sent to Kafka")

def run_consumer():
    print("Consumer running...")
    subprocess.run(["python", "/opt/airflow/project/Ingestion/kafka_consumer.py"])
    print("Data saved to CSV")

def run_loader():
    print("Loading to PostgreSQL...")
    subprocess.run(["python", "/opt/airflow/project/Warehouse/load_to_postgres.py"])
    print("Data inserted successfully")

with DAG(
    dag_id='crypto_genome_pipeline',
    start_date=datetime(2024, 1, 1),
    schedule_interval=None,
    catchup=False
) as dag:

    producer = PythonOperator(task_id='run_producer', python_callable=run_producer)
    consumer = PythonOperator(task_id='run_consumer', python_callable=run_consumer)
    loader = PythonOperator(task_id='run_loader', python_callable=run_loader)

    producer >> consumer >> loader