from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from datetime import datetime
import psycopg2

def validate_data():
    print("Checking data in PostgreSQL...")
    conn = psycopg2.connect(
        host="host.docker.internal",
        database="crypto_genome",
        user="admin",
        password="admin",
        port="5432"
    )
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM asset_history;")
    count = cur.fetchone()[0]
    print(f"Total rows in asset_history: {count}")
    
    cur.execute("SELECT symbol, current_price, last_updated_at FROM assets WHERE pipeline_status='active' LIMIT 5;")
    rows = cur.fetchall()
    print("Latest snapshot of live assets:")
    for r in rows:
        print(r)
        
    conn.close()

with DAG(
    dag_id='crypto_genome_pipeline',
    start_date=datetime(2024, 1, 1),
    schedule_interval=None,
    catchup=False
) as dag:

    # Run consumer and producer concurrently so they can exchange messages
    run_pipeline = BashOperator(
        task_id='run_pipeline',
        bash_command='''
        export KAFKA_HOST="host.docker.internal:9092"
        export PG_HOST="host.docker.internal"
        
        echo "Starting Consumer in background..."
        timeout 30s python /opt/airflow/project/Ingestion/kafka_consumer.py &
        
        sleep 5
        
        echo "Starting Producer in background..."
        timeout 20s python /opt/airflow/project/Ingestion/kafka_producer_binance.py &
        
        wait
        exit 0
        '''
    )

    validate = PythonOperator(
        task_id='validate_data',
        python_callable=validate_data
    )

    run_pipeline >> validate