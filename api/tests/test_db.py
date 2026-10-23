

from app.db.connection import get_db_connection

def test_db_connection():
    
    with get_db_connection() as connection:
        result = connection.execute(
            "SELECT current_database() AS database_name, current_user AS user_name, version() AS version"
            ).fetchone()

    assert result is not None
    assert result["database_name"] == "ispark_attendance"
    assert result["user_name"] == "ispark_dev_user"
    assert result["version"] is not None