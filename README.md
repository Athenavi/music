<div align="center">
	<img src="https://7trees.cn/static/favicon.ico" width="160" />
	<h1>zyMusic</h1>
</div>




> [!NOTE]
> 如果您觉得 `zyMusic`对您有所帮助，或者您喜欢我们的项目，请在 GitHub 上给我们一个 ⭐️。您的支持是我们持续改进和增加新功能的动力！感谢您的支持！

## 预览

- 暂无预览

## 技术组成

- **Python Flask**
- **React**

## 功能特点

暂未更新

## 示例图片

![](./cover/357b2ce2ea9c912e94d4209ae5087370.png)

## 如何运行

后台服务:

1. 确保你的系统已经安装了 Python 和 pip。
2. 克隆或下载 zyMusic 代码库到本地。创建一个数据库，导入本项目里的 *sql* 文件，配置 *config.ini*
3. 在终端中进入项目根目录，并执行以下命令的顺序执行以启动 zyMusic 后台程序：

```bash
$ pip install -r requirements.txt
$ python main.py
```

前台服务:

1. 确保你的系统已经安装了并配置了 node 环境
2. 进入 项目根目录/web ，配置 *config.js* 以供程序连接到后台服务

```bash
$ cd ./web
```

3. 在终端中执行以下命令的顺序执行以启动 zyMusic 前台程序
   启动前先创建 `cover` 文件夹，以及 `temp` 文件夹 和  `storage` 文件夹

```bash
$ npm install
$ npm start
```

4. 在浏览器中访问 `http://localhost:3000`，即可进入 zyMusic。

## nginx 建议配置

```nginx
location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host:$server_port;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header REMOTE-HOST $remote_addr;
        add_header X-Cache $upstream_cache_status;
        proxy_set_header X-Host $host:$server_port;
        proxy_set_header X-Scheme $scheme;
        proxy_connect_timeout 30s;
        proxy_read_timeout 86400s;
        proxy_send_timeout 30s;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location ^~ /back {
        proxy_pass http://127.0.0.1:10086/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # 可选：解决WebSocket代理问题
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        # 超时配置
        proxy_connect_timeout 60s;
        proxy_read_timeout 86400s;
    }
```

### 音乐数据导入（仅支持.mp3）:

1. ok,在此项目之前确保你的数据库已经成功创建
2. 进入 项目根目录 ，你可以使用python `autoCreate.py` 来为你的数据库导入数据

### 音乐歌词导入 （.lrc）:

1. 歌词文件放在 `lrc` 文件夹中
2. 命名方式： `${singer} - ${name}.lrc`

## 开源贡献者

感谢以下各位的贡献

<img src="https://contrib.rocks/image?repo=Athenavi/zyMusic" />

## 交流

暂无开放

## 免责声明

zyMusic 是一个个人项目，并未经过详尽测试和完善，因此不对其能力和稳定性做出任何保证。使用 zyMusic 时请注意自己的数据安全和程序稳定性。任何由于使用
zyMusic 造成的数据丢失、损坏或其他问题，作者概不负责。

**请谨慎使用 zyMusic，并在使用之前备份你的数据。**

