from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime
import subprocess
import sys
import os

sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), '../../Warehouse')
    )
)

from load_to_postgres import load_to_postgres_function

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

    run_loader = PythonOperator(
    task_id='run_loader',
    python_callable=load_to_postgres_function
    )

    producer_task >> consumer_task >> run_loader