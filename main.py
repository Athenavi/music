import json
import logging
import os
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from io import BytesIO
from typing import Optional

import requests
from PIL import Image
from databases import Database
from dotenv import load_dotenv
from fastapi import (
    FastAPI, HTTPException, Response,
    Query, Path
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import MetaData, Table, Column, Integer, String, Text, DateTime

from database import get_database_url

# 加载环境变量
load_dotenv()

# 配置日志
logging.basicConfig(
    filename='user.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# 数据库配置
DATABASE_URL = get_database_url()
database = Database(DATABASE_URL)
metadata = MetaData()

songs = Table(
    'songs', metadata,
    Column('SongID', Integer, primary_key=True),
    Column('Title', String(255)),
    Column('ArtistID', Integer),
    Column('AlbumID', Integer),
    Column('FilePath', String(500)),
    Column('CoverImagePath', String(500)),
    Column('Lyrics', Text),
)

albums = Table(
    'albums', metadata,
    Column('AlbumID', Integer, primary_key=True),
    Column('Title', String(255)),
    Column('ReleaseDate', DateTime),
)

playlists = Table(
    'playlists', metadata,
    Column('PlaylistID', Integer, primary_key=True),
    Column('Name', String(255)),
    Column('Description', Text),
    Column('UserID', Integer),
)

artists = Table(
    'artists', metadata,
    Column('ArtistID', Integer, primary_key=True),
    Column('Name', String(255)),
)


# Pydantic模型
class UserLogin(BaseModel):
    username: str
    password: str


class CountUsersRequest(BaseModel):
    userIP: str
    userAgent: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[str] = None


# JWT配置
JWT_SECRET_KEY = "super-secret"
ALGORITHM = "HS256"
security = HTTPBearer()


# 获取配置
def get_general_conf():
    domain = os.getenv('DOMAIN', 'http://localhost:10086')
    title = os.getenv('TITLE', 'Music API')
    api_url = os.getenv('API_URL', 'https://api.example.com/')
    return domain, title, api_url


domain, sitename, API_URL = get_general_conf()


# 应用生命周期
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时
    await database.connect()
    print("Database connected successfully")
    yield
    # 关闭时
    await database.disconnect()
    print("Database disconnected")


# 创建FastAPI应用
app = FastAPI(
    title="Music API",
    description="基于FastAPI的音乐服务API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件目录
base_dir = os.path.dirname(os.path.abspath(__file__))
app.mount("/storage", StaticFiles(directory=os.path.join(base_dir, "storage")), name="storage")
app.mount("/cover", StaticFiles(directory=os.path.join(base_dir, "cover")), name="cover")
app.mount("/lrc", StaticFiles(directory=os.path.join(base_dir, "lrc")), name="lrc")


# 基础路由
@app.get("/")
async def home():
    return {"message": "service is running"}


@app.post("/api/count_users")
async def count_users(data: CountUsersRequest):
    logging.info(f"User IP: {data.userIP}, User Agent: {data.userAgent}")
    return {"message": "User data received", "userIP": data.userIP}


# 搜索和发现
CACHE_DIR = 'temp/search'
CACHE_EXPIRY = 24 * 60 * 60  # 24小时


@app.get("/api/search")
async def api_search(keyword: str = Query(..., description="搜索关键词")):
    if not keyword:
        raise HTTPException(status_code=400, detail="Keyword is required")

    cache_file_path = os.path.join(CACHE_DIR, f"{keyword}.json")

    # 检查缓存
    if os.path.exists(cache_file_path):
        file_mod_time = os.path.getmtime(cache_file_path)
        current_time = time.time()
        if (current_time - file_mod_time) < CACHE_EXPIRY:
            with open(cache_file_path, 'r', encoding='utf-8') as cache_file:
                return json.load(cache_file)

    # 从API获取数据
    try:
        search_api_url = f'{API_URL}search?keywords={keyword}'
        response = requests.get(search_api_url, timeout=3)
        data = response.json()

        # 保存到缓存
        os.makedirs(CACHE_DIR, exist_ok=True)
        with open(cache_file_path, 'w', encoding='utf-8') as cache_file:
            json.dump(data, cache_file, ensure_ascii=False, indent=2)

        return data
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=408, detail="Request timeout")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"External API error: {str(e)}")


@app.get("/api/Recommend")
async def api_Recommend(pageType: str = Query("al", description="页面类型: al-专辑, pl-歌单")):
    if pageType == "al":
        query = albums.select().with_only_columns([albums.c.AlbumID, albums.c.Title, albums.c.ReleaseDate])
    elif pageType == "pl":
        query = playlists.select().with_only_columns(
            [playlists.c.PlaylistID, playlists.c.Name, playlists.c.Description])
    else:
        raise HTTPException(status_code=400, detail="Invalid pageType")

    try:
        results = await database.fetch_all(query)
        return [dict(row) for row in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 歌手相关
@app.get("/api/singer")
async def api_singer(uid: int = Query(None, description="歌手ID")):
    if uid:
        singer_data = await singer_detail(uid)
        if isinstance(singer_data, dict) and singer_data.get('error'):
            raise HTTPException(status_code=404, detail=singer_data['error'])
        return {"歌手": singer_data}

    all_singers = await get_all_singer()
    if isinstance(all_singers, dict) and all_singers.get('error'):
        raise HTTPException(status_code=404, detail=all_singers['error'])
    return {"歌手": all_singers}


async def get_all_singer():
    try:
        query = """
                SELECT DISTINCT artists.ArtistID, artists.Name
                FROM songs
                         INNER JOIN artists ON songs.ArtistID = artists.ArtistID \
                """
        results = await database.fetch_all(query)
        return [dict(row) for row in results]
    except Exception as e:
        return {'error': str(e)}


async def singer_detail(uid: int):
    try:
        query = """
                SELECT songs.SongID, songs.Title, artists.Name
                FROM songs
                         INNER JOIN artists ON songs.ArtistID = artists.ArtistID
                WHERE artists.ArtistID = :artist_id \
                """
        results = await database.fetch_all(query, {"artist_id": uid})
        return [dict(row) for row in results] if results else {'error': 'No songs found for this artist'}
    except Exception as e:
        return {'error': str(e)}


# 详情页面
@app.get("/api/Detail")
async def api_PlayListDetail(
        pid: int = Query(..., description="ID"),
        pageType: str = Query(..., description="类型: pl-歌单, al-专辑")
):
    if pageType == 'pl':
        songs_data = await song_name(pid=pid)
        return {"歌曲列表": songs_data}
    elif pageType == 'al':
        album_data = await album_detail(pid)
        return {"歌曲列表": album_data}
    else:
        raise HTTPException(status_code=400, detail="Invalid pageType")


async def album_detail(pid: int):
    try:
        query = """
                SELECT songs.SongID, songs.Title, artists.Name
                FROM songs
                         INNER JOIN artists ON songs.ArtistID = artists.ArtistID
                WHERE songs.AlbumID = :album_id \
                """
        results = await database.fetch_all(query, {"album_id": pid})
        return [dict(row) for row in results] if results else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 音乐文件服务
@app.get("/music/{id}.mp3")
async def get_music_file(id: int = Path(..., description="歌曲ID")):
    music_file_path = os.path.join(base_dir, "storage", f"{id}.mp3")

    # 检查本地文件
    if os.path.exists(music_file_path):
        return FileResponse(music_file_path, media_type="audio/mp3", filename=f"{id}.mp3")

    # 检查数据库中的文件路径
    query = songs.select().where(songs.c.SongID == id)
    song = await database.fetch_one(query)

    if song and song["FilePath"] and os.path.exists(song["FilePath"]):
        return FileResponse(song["FilePath"], media_type="audio/mp3", filename=f"{id}.mp3")

    # 从外部API获取
    return await play_music_data_from_api(id, music_file_path)


async def play_music_data_from_api(song_id: int, local_file_path: str):
    byfuns_url = f"https://www.byfuns.top/api/1/?id={song_id}"

    try:
        response = requests.get(byfuns_url)
        if response.status_code == 200:
            music_url = response.text.strip()

            music_response = requests.get(music_url)
            if music_response.status_code == 200:
                # 确保目录存在
                os.makedirs(os.path.dirname(local_file_path), exist_ok=True)

                # 保存文件
                with open(local_file_path, 'wb') as f:
                    f.write(music_response.content)

                return FileResponse(local_file_path, media_type="audio/mp3", filename=f"{song_id}.mp3")
            else:
                raise HTTPException(status_code=500, detail="无法下载音乐文件")
        else:
            raise HTTPException(status_code=500, detail="无法获取音乐链接")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"发生错误: {str(e)}")


# 封面图片服务
@app.get("/music_cover/{id}.png")
async def cover_file(id: int = Path(..., description="歌曲或歌手ID")):
    covers_dir = os.path.join(base_dir, 'cover')
    cover_file_path = os.path.join(covers_dir, f'{id}.png')

    if os.path.exists(cover_file_path):
        return FileResponse(cover_file_path, media_type="image/png")

    if id > 100000:
        return await get_cover_from_api(id, cover_file_path)
    else:
        cover_file_path1 = await get_cover_from_file(id, covers_dir)
        if cover_file_path1:
            return FileResponse(cover_file_path1, media_type="image/png")

    default_cover_path = os.path.join(covers_dir, '0.png')
    if os.path.exists(default_cover_path):
        return FileResponse(default_cover_path, media_type="image/png")

    raise HTTPException(status_code=404, detail="Cover not found")


async def get_cover_from_api(song_id: int, local_file_path: str):
    song_info = await get_song_info(song_id)
    if 'error' in song_info:
        raise HTTPException(status_code=404, detail=song_info['error'])

    url = song_info['cover']
    try:
        response = requests.get(url)
        if response.status_code == 200:
            os.makedirs(os.path.dirname(local_file_path), exist_ok=True)
            with open(local_file_path, 'wb') as f:
                f.write(response.content)
            return FileResponse(local_file_path, media_type="image/png")
        else:
            raise HTTPException(status_code=500, detail="无法下载封面图片")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"发生错误: {str(e)}")


async def get_cover_from_file(id: int, covers_dir: str):
    cover_file_path = os.path.join(covers_dir, f'{id}.png')

    if os.path.exists(cover_file_path):
        return cover_file_path

    query = songs.select().where(songs.c.SongID == id)
    song = await database.fetch_one(query)

    if song and song["FilePath"] and os.path.exists(song["FilePath"]):
        # 这里需要 mutagen 库来读取MP3文件的封面
        # 由于mutagen是同步库，可能需要在线程中执行
        try:
            from mutagen.mp3 import MP3
            from mutagen.id3 import ID3, APIC

            audio = MP3(song["FilePath"], ID3=ID3)
            for tag in audio.tags.values():
                if isinstance(tag, APIC):
                    cover_data = tag.data
                    img = Image.open(BytesIO(cover_data))

                    # 转换为PNG并保存
                    os.makedirs(covers_dir, exist_ok=True)
                    img.save(cover_file_path, 'PNG')
                    return cover_file_path
        except Exception:
            pass

    return None


# 歌曲信息
async def get_song_info(song_id: int):
    cache_file_path = f'temp/info_{song_id}.json'

    if os.path.exists(cache_file_path):
        file_mod_time = os.path.getmtime(cache_file_path)
        if time.time() - file_mod_time < 3 * 24 * 60 * 60:  # 三天有效期
            with open(cache_file_path, 'r', encoding='utf-8') as f:
                return json.load(f)

    url = f"https://api.paugram.com/netease/?id={song_id}"
    try:
        response = requests.get(url)
        response_json = response.json()

        if 'id' in response_json:
            song_info = response_json
            result = {
                'id': song_info['id'],
                'title': song_info['title'],
                'artist': song_info['artist'],
                'album': song_info['album'],
                'cover': song_info['cover'],
                'url': song_info['link'],
                'lyric': song_info.get('lyric', ''),
                'sub_lyric': song_info.get('sub_lyric', '')
            }

            os.makedirs(os.path.dirname(cache_file_path), exist_ok=True)
            with open(cache_file_path, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=4)

            return result
        else:
            return {'error': response_json.get('msg', '未知错误')}
    except Exception as e:
        return {'error': str(e)}


@app.get("/music_info/{id}")
async def music_info(id: int):
    query = """
            SELECT Title, \
                   ArtistID, \
                   AlbumID, \
                   Genre, \
                   Duration, \
                   ReleaseDate,
                   FilePath, \
                   Lyrics, Language, PlayCount, CreateTime, UpdateTime
            FROM songs \
            WHERE SongID = :song_id \
            """
    song_data = await database.fetch_one(query, {"song_id": id})

    if not song_data:
        raise HTTPException(status_code=404, detail="Song not found")

    return {
        "id": id,
        "title": song_data["Title"],
        "artist": song_data["ArtistID"],
        "album": song_data["AlbumID"],
        "genre": song_data["Genre"],
        "duration": song_data["Duration"],
        "releaseDate": song_data["ReleaseDate"],
        "filePath": song_data["FilePath"],
        "lyrics": song_data["Lyrics"],
        "language": song_data["Language"],
        "playCount": song_data["PlayCount"],
        "createTime": song_data["CreateTime"],
        "updateTime": song_data["UpdateTime"]
    }


# 歌词服务
@app.get("/api/lrc/{song_id}")
async def get_lrc(song_id: int):
    lrc_file_dir = os.path.join(base_dir, 'lrc', f'{song_id}.lrc')

    if os.path.exists(lrc_file_dir):
        return FileResponse(lrc_file_dir, media_type="text/plain")

    query = songs.select().where(songs.c.SongID == song_id)
    song = await database.fetch_one(query)

    if song and song["Lyrics"]:
        # 保存到文件以便下次使用
        os.makedirs(os.path.dirname(lrc_file_dir), exist_ok=True)
        with open(lrc_file_dir, 'w', encoding='utf-8') as f:
            f.write(song["Lyrics"])

        return Response(content=song["Lyrics"], media_type="text/plain")

    # 从缓存获取
    tmp_file_dir = os.path.join(base_dir, 'temp', f'info_{song_id}.json')
    if os.path.exists(tmp_file_dir):
        with open(tmp_file_dir, 'r', encoding='utf-8') as f:
            data = json.load(f)
            lrc_content = data.get('lyric', '')
            if lrc_content:
                await save_lyrics(lrc_content, song_id)
                return Response(content=lrc_content, media_type="text/plain")

    raise HTTPException(status_code=404, detail="Lyrics not found")


async def save_lyrics(lyrics: str, song_id: int):
    lrc_file_dir = os.path.join(base_dir, 'lrc', f'{song_id}.lrc')
    os.makedirs(os.path.dirname(lrc_file_dir), exist_ok=True)
    with open(lrc_file_dir, 'w', encoding='utf-8') as f:
        f.write(lyrics)


# 歌曲名称查询
@app.get("/song/name/")
async def song_name(
        id: Optional[str] = Query(None, description="歌曲ID列表(逗号分隔)"),
        pid: Optional[int] = Query(None, description="播放列表ID"),
        uid: Optional[int] = Query(None, description="用户ID")
):
    if id and not pid:
        song_data = await song_name_list(id)
        return song_data
    elif pid:
        return await get_playlist_songs(pid)
    elif uid and not pid and not id:
        return await get_artist_songs(uid)
    else:
        raise HTTPException(status_code=400, detail="Invalid parameters")


async def song_name_list(ids: str):
    try:
        query = f"""
        SELECT songs.SongID, songs.Title, artists.Name 
        FROM songs 
        JOIN artists ON songs.ArtistID = artists.ArtistID 
        WHERE songs.SongID IN ({ids})
        """
        results = await database.fetch_all(query)
        return [dict(row) for row in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def get_playlist_songs(pid: int):
    try:
        # 首先获取播放列表中的歌曲ID
        query = "SELECT SongID FROM playlist_songs WHERE PlayListID = :playlist_id"
        list_data = await database.fetch_all(query, {"playlist_id": pid})

        if not list_data:
            return []

        song_ids = [str(row["SongID"]) for row in list_data]
        str_list = ','.join(song_ids)

        return await song_name_list(str_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def get_artist_songs(uid: int):
    try:
        query = """
                SELECT songs.SongID, songs.Title, artists.Name
                FROM songs
                         JOIN artists ON songs.ArtistID = artists.ArtistID
                WHERE songs.ArtistID = :artist_id \
                """
        results = await database.fetch_all(query, {"artist_id": uid})
        return [dict(row) for row in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 排行榜
@app.get("/api/toplist")
async def api_topLists():
    try:
        query = "SELECT TargetID FROM hot WHERE Type = 'SONG'"
        results = await database.fetch_all(query)

        if not results:
            return []

        hot_id_list = [str(row["TargetID"]) for row in results]
        str_list = ','.join(hot_id_list)

        return await song_name_list(str_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 专辑相关
@app.get("/api/album")
async def api_album():
    try:
        query = "SELECT AlbumID, Title, ReleaseDate FROM albums"
        results = await database.fetch_all(query)
        return [dict(row) for row in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 其他兼容性端点（保持与原有API的兼容）
@app.get("/login/cellphone")
async def login_cellphone(
        phone: str = Query(..., description="手机号"),
        password: Optional[str] = Query(None, description="密码"),
        md5_password: Optional[str] = Query(None, description="MD5加密密码"),
        captcha: Optional[str] = Query(None, description="验证码"),
        countrycode: str = Query("86", description="国家代码")
):
    return {
        "message": "登录成功",
        "phone": phone,
        "countrycode": countrycode
    }


@app.get("/login/qr/key")
async def login_qr_key():
    login_key = str(uuid.uuid4())
    login_url = f"{domain}login/callback?key={login_key}"
    return {"code": "200", "key": login_key, "qr_url": ''}


@app.get("/login/qr/check")
async def login_qr_check(key: str = Query(..., description="二维码key")):
    return {
        "message": "二维码扫描状态检查",
        "key": key,
        "status": "803"
    }


@app.get("/register/anonimous")
async def register_anonimous():
    return {
        "message": "游客登录成功",
        "cookie": "anonimous_cookie"
    }


# 更多兼容端点...
@app.get("/banner")
async def banner():
    return {"banners": ["banner1", "banner2"]}


@app.get("/personalized/mv")
async def personalized_mv():
    return {
        "recommend_mvs": [
            {"id": 1, "name": "Recommended MV 1"},
            {"id": 2, "name": "Recommended MV 2"}
        ]
    }


@app.post("/like")
async def like_song(
        id: int = Query(..., description="歌曲ID"),
        like: bool = Query(True, description="喜欢状态")
):
    action = "Liked" if like else "Unliked"
    return {
        "status": "success",
        "message": f"{action} song with ID {id}"
    }


# 健康检查
@app.get("/health")
async def health_check():
    try:
        # 测试数据库连接
        await database.execute("SELECT 1")
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Service unhealthy: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=10086,
        reload=True,
        log_level="info"
    )
