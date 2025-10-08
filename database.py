import os

import mysql.connector
import mysql.connector.pooling
from dotenv import load_dotenv


def get_db_connection(pool_name="mypool", pool_size=5):
    # 加载 .env 文件
    load_dotenv()

    # 读取环境变量并提供默认值或验证
    db_host = os.getenv('DATABASE_HOST')
    db_port = os.getenv('DATABASE_PORT')
    db_user = os.getenv('DATABASE_USER')
    db_password = os.getenv('DATABASE_PASSWORD')
    db_name = os.getenv('DATABASE_NAME')

    # 验证必要的环境变量
    if not all([db_host, db_port, db_user, db_password, db_name]):
        missing_vars = []
        if not db_host: missing_vars.append('DATABASE_HOST')
        if not db_port: missing_vars.append('DATABASE_PORT')
        if not db_user: missing_vars.append('DATABASE_USER')
        if not db_password: missing_vars.append('DATABASE_PASSWORD')
        if not db_name: missing_vars.append('DATABASE_NAME')

        raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

    # 确保端口是有效的整数
    try:
        port = int(db_port)
    except (TypeError, ValueError) as e:
        raise ValueError(f"Invalid DATABASE_PORT: {db_port}. Must be a valid integer.") from e

    db_config = {
        'host': db_host,
        'port': port,
        'user': db_user,
        'password': db_password,
        'database': db_name
    }

    # 创建连接池
    try:
        db_pool = mysql.connector.pooling.MySQLConnectionPool(
            pool_name=pool_name,
            pool_size=pool_size,
            host=db_config['host'],
            port=db_config['port'],
            user=db_config['user'],
            password=db_config['password'],
            database=db_config['database']
        )
        return db_pool
    except mysql.connector.Error as err:
        raise mysql.connector.Error(f"Failed to create connection pool: {err}") from err


def get_database_url():
    # 加载 .env 文件
    load_dotenv()
    db_host = os.getenv('DATABASE_HOST')
    db_port = os.getenv('DATABASE_PORT')
    db_user = os.getenv('DATABASE_USER')
    db_password = os.getenv('DATABASE_PASSWORD')
    db_name = os.getenv('DATABASE_NAME')

    # 验证必要的环境变量
    if not all([db_host, db_port, db_user, db_password, db_name]):
        missing_vars = []
        if not db_host: missing_vars.append('DATABASE_HOST')
        if not db_port: missing_vars.append('DATABASE_PORT')
        if not db_user: missing_vars.append('DATABASE_USER')
        if not db_password: missing_vars.append('DATABASE_PASSWORD')
        if not db_name: missing_vars.append('DATABASE_NAME')

        raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

    # 确保端口是有效的整数
    try:
        port = int(db_port)
    except (TypeError, ValueError) as e:
        raise ValueError(f"Invalid DATABASE_PORT: {db_port}. Must be a valid integer.") from e

    # 构造数据库连接字符串
    db_url = f"mysql+aiomysql://{db_user}:{db_password}@{db_host}:{port}/{db_name}"
    return db_url


def test_database_connection():
    db = None  # 初始化db变量
    try:
        db_pool = get_db_connection()
        db = db_pool.get_connection()
        print("Database connection is successful.")

        # 测试连接是否真的有效
        cursor = db.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        print(f"Test query result: {result}")
        cursor.close()

    except ValueError as ve:
        print(f"Configuration error: {ve}")
    except mysql.connector.Error as err:
        print(f"Database connection error: {err}")
    except Exception as e:
        print(f"Unexpected error: {e}")
    finally:
        # 只有在db变量被成功赋值且连接已建立时才关闭连接
        if db is not None and db.is_connected():
            db.close()
            print("Database connection closed.")


if __name__ == '__main__':
    test_database_connection()
