import os
import psycopg2


def get_connection():

    connection = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        database=os.getenv("DB_NAME", "task_manager"),
        user=os.getenv("DB_USER", "hv"),
        password=os.getenv("DB_PASSWORD")
    )

    return connection