

import os

import psycopg
from dotenv import load_dotenv
from psycopg.rows import dict_row

# Load environment variables from .env
load_dotenv()

def get_db_connection():
    """ Open a connection to postgres database. """
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise RuntimeError("DATABASE_URL is missing from the environment")

    return psycopg.connect(
        database_url,
        row_factory=dict_row
    )