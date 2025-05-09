import os
from database import get_database_connection
from mutagen.mp3 import MP3
from mutagen.id3 import ID3, ID3NoHeaderError, TPE1, TIT2, TCON, TALB, TDRC, TRCK, TPOS, TCOM, COMM, USLT
from datetime import datetime

# 连接数据库
db = get_database_connection()
cursor = db.cursor()


def convert_id3_timestamp(year_tag):
    try:
        timestamp_str = year_tag.text[0]
        # 处理不同格式的时间戳（YYYY、YYYY-MM-DD等）
        return int(timestamp_str.split('-')[0]) if timestamp_str else None
    except (TypeError, IndexError, AttributeError):
        return None


def parse_number(value):
    """解析分轨格式（如"1/2"）并返回第一个数字"""
    try:
        return int(value.split('/')[0].strip()) if value else None
    except (ValueError, AttributeError):
        return None


def add_song_to_database(file_path):
    audio = MP3(file_path, ID3=ID3)
    id3v2 = audio.tags if audio.tags else None

    # 基础信息
    artist = id3v2.get("TPE1").text[0] if id3v2 and id3v2.get("TPE1") else "Unknown Artist"
    title = id3v2.get("TIT2").text[0] if id3v2 and id3v2.get("TIT2") else os.path.basename(file_path).replace(".mp3",
                                                                                                              "")
    genre = id3v2.get("TCON").text[0] if id3v2 and id3v2.get("TCON") else "Unknown Genre"
    duration = int(audio.info.length)
    album = id3v2.get("TALB").text[0] if id3v2 and id3v2.get("TALB") else "Unknown Album"
    album_artist = id3v2.get("TPE2").text[0] if id3v2 and id3v2.get("TPE2") else artist

    # 年份处理
    year_tag = id3v2.get("TDRC") or id3v2.get("TYER")
    year = convert_id3_timestamp(year_tag)
    release_date = f"{year}-01-01" if year else None

    # 轨道号和碟号
    track_value = id3v2.get("TRCK").text[0] if id3v2 and id3v2.get("TRCK") else None
    track_number = parse_number(track_value)

    disc_value = id3v2.get("TPOS").text[0] if id3v2 and id3v2.get("TPOS") else None
    disc_number = parse_number(disc_value)

    # 创作信息
    composer = id3v2.get("TCOM").text[0] if id3v2 and id3v2.get("TCOM") else None
    lyricist = id3v2.get("TEXT").text[0] if id3v2 and id3v2.get("TEXT") else None

    # 评论（优先获取英文评论）
    comments = None
    if id3v2:
        comm_frame = id3v2.get("COMM::eng") or id3v2.get("COMM")
        if comm_frame:
            comments = comm_frame.text[0] if isinstance(comm_frame.text, list) else comm_frame.text

    # 歌词处理
    lyrics = None
    if id3v2:
        uslt_frame = next((frame for frame in id3v2.getall("USLT") if frame), None)
        if uslt_frame:
            lyrics = uslt_frame.text if isinstance(uslt_frame.text, str) else uslt_frame.text[0]

    # 音频技术信息
    channels = audio.info.channels if hasattr(audio.info, "channels") else None

    # 用户输入信息
    cover_image_path = input(f"请输入歌曲 {title} 的封面图片路径：")
    language = input(f"请输入歌曲 {title} 的语言（直接回车使用默认语言 '国语'）：") or "国语"

    # 数据库操作
    cursor.execute("SELECT ArtistID FROM artists WHERE Name = %s", (artist,))
    result = cursor.fetchone()
    artist_id = result[0] if result else None
    if not artist_id:
        cursor.execute("INSERT INTO artists (Name) VALUES (%s)", (artist,))
        artist_id = cursor.lastrowid
        db.commit()

    cursor.execute("SELECT AlbumID FROM albums WHERE Title = %s", (album,))
    result = cursor.fetchone()
    album_id = result[0] if result else None
    if not album_id:
        cursor.execute("INSERT INTO albums (Title, ArtistID) VALUES (%s, %s)", (album, artist_id))
        album_id = cursor.lastrowid
        db.commit()

    current_time = datetime.now()

    # 插入歌曲信息
    cursor.execute("""
        INSERT INTO songs 
        (Title, ArtistID, AlbumID, Genre, Duration, ReleaseDate, FilePath, CoverImagePath, 
         Lyrics, Language, PlayCount, CreateTime, UpdateTime, AlbumArtist, Year, 
         TrackNumber, DiscNumber, Composer, Lyricist, Comments, Channels)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        title, artist_id, album_id, genre, duration, release_date, file_path, cover_image_path,
        lyrics, language, 0, current_time, current_time, album_artist, year,
        track_number, disc_number, composer, lyricist, comments, channels
    ))

    db.commit()


def scan_folder(folder_path):
    for root, _, files in os.walk(folder_path):
        for file in files:
            if file.lower().endswith(".mp3"):
                add_song_to_database(os.path.join(root, file))


def get_folder_path():
    if os.name == 'nt':  # Windows
        prompt = "请输入文件夹地址（例如：D:\\sample\\floder）："
    else:  # Linux 或其他系统
        prompt = "请输入文件夹地址（例如：/sample/floder）："

    folder_path = input(prompt)
    return folder_path


# 获取用户输入的文件夹路径
folder_path = get_folder_path()
scan_folder(folder_path)

# 关闭数据库连接
db.close()
