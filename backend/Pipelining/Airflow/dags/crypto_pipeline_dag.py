from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime
import subprocess

def run_producer():
    subprocess.run(["python", "../../Ingestion/kafka_producer.py"])

def run_consumer():
    subprocess.run(["python", "../../Ingestion/kafka_consumer.py"])

def run_loader():
    subprocess.run(["python", "../../Warehouse/load_to_postgres.py"])

with DAG(
    dag_id="crypto_genome_pipeline",
    start_date=datetime(2024, 1, 1),
    schedule_interval=None,
    catchup=False
) as dag:

    producer_task = PythonOperator(
        task_id="run_producer",
        python_callable=run_producer
    )

    consumer_task = PythonOperator(
        task_id="run_consumer",
        python_callable=run_consumer
    )

    loader_task = PythonOperator(
        task_id="run_loader",
        python_callable=run_loader
    )

    producer_task >> consumer_task >> loader_task