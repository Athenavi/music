from database import get_database_connection

# 连接数据库
mydb = get_database_connection()

mycursor = mydb.cursor()

# 获取用户输入的起始值和结束值
start_value = int(input("请输入起始值（正整数）："))
end_value = int(input("请输入结束值（正整数）："))

# 检查用户输入的值
if start_value <= 0 or end_value <= 0 or start_value > end_value:
    print("请输入合法的起始值和结束值（均为正整数且起始值应小于等于结束值）")
else:
    # 构建 SQL 插入语句
    sql = "INSERT INTO hot (TargetID, Type, Position, UpdateTime) VALUES "
    values = []
    for i in range(start_value, end_value + 1):
        values.append(f"({i}, 'SONG', {i}, '2024-07-08 08:00:00')")

    sql += ",\n".join(values)

    # 执行 SQL 插入操作
    mycursor.execute(sql)

    # 提交更改
    mydb.commit()

    print(f"成功插入数据，从 {start_value} 到 {end_value}")

# 关闭数据库连接
mycursor.close()
mydb.close()
