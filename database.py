import mysql.connector
import configparser


def get_db_connection():
    config = configparser.ConfigParser()
    try:
        config.read('config.ini', encoding='utf-8')
    except UnicodeDecodeError:
        config.read('config.ini', encoding='gbk')

    db_config = dict(config.items('database'))

    zy_db = mysql.connector.connect(
        host=db_config['host'].strip("'"),
        port=int(db_config['port'].strip("'")),  # 将端口转换为整数类型，并去除单引号
        user=db_config['user'].strip("'"),
        password=db_config['password'].strip("'"),
        database=db_config['database'].strip("'")
    )
    return zy_db


def test_database_connection():
    try:
        db = get_db_connection()
        db.close()
        print("Database connection is successful.")
    except mysql.connector.Error as err:
        print(f"Failed to connect to the database: {err}")


if __name__ == '__main__':
    test_database_connection()
