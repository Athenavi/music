import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../../config';
import { MdDragIndicator, MdClose, MdEdit, MdCheck } from 'react-icons/md';
import './CurrentList.css';

// 类型定义
interface Song {
  id: number;
  title: string;
  artist: string;
}

interface PlaylistData {
  "播放列表": Song[];
}

interface CurrentListProps {
  pid: string;
  setMusicId: (id: number) => void;
  handleNextSong: (id: number) => void;
  toggleVisable?: () => void;
}

// 拖拽结果类型
interface DragResult {
  destination?: {
    index: number;
  };
  source: {
    index: number;
  };
}

const CurrentList: React.FC<CurrentListProps> = React.memo(({
  pid,
  setMusicId,
  handleNextSong,
  toggleVisable
}) => {
  const [data, setData] = useState<PlaylistData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 转换数据格式
  const convertData = useCallback((apiData: any): PlaylistData => ({
    "播放列表": apiData["播放列表"].map(([id, title, artist]: [number, string, string]) => ({
      id,
      title: title || "Unknown Title",
      artist: artist || "Unknown Artist",
    })),
  }), []);

  // 获取播放列表数据
  const fetchData = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/userSongList?pid=${pid}`);
      if (!res.ok) throw new Error('Network response was not ok');

      const responseData = await res.json();
      const convertedData = convertData(responseData);
      setData(convertedData);
      localStorage.setItem('currentPlaylist', JSON.stringify(convertedData));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pid, convertData, isLoading]);

  // 初始化数据
  useEffect(() => {
    const cachedData = localStorage.getItem('currentPlaylist');
    if (cachedData) {
      try {
        setData(JSON.parse(cachedData));
      } catch (error) {
        console.error('Error parsing cached data:', error);
        fetchData();
      }
    } else {
      fetchData();
    }
  }, [fetchData]);

  // 删除歌曲
  const handleRemove = useCallback((id: number) => {
    setData((prev) => {
      if (!prev) return prev;

      const updated = {
        ...prev,
        播放列表: prev.播放列表.filter((item) => item.id !== id),
      };
      localStorage.setItem('currentPlaylist', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // 拖拽处理
  const handleDragEnd = useCallback((result: DragResult) => {
    if (!result.destination || !isEditing || !data) return;

    const items = [...data.播放列表];
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const newData = { ...data, 播放列表: items };
    setData(newData);
    localStorage.setItem('currentPlaylist', JSON.stringify(newData));
  }, [isEditing, data]);

  // 处理歌曲点击
  const handleSongClick = useCallback((e: React.MouseEvent, id: number, isEditing: boolean) => {
    if (isEditing) {
      e.preventDefault();
      return;
    }
    setMusicId(id);
    handleNextSong(id);
  }, [setMusicId, handleNextSong]);

  // 记忆化歌曲列表
  const songList = useMemo(() => {
    if (!data) return null;

    return (
      <div onDragEnd={handleDragEnd}>
        <ul className="song-list" style={{ minHeight: 10 }}>
          {data.播放列表.map((item, index) => (
            <li
              key={`${item.id}-${index}`}
              className={`song-item ${isEditing ? 'editing' : ''}`}
              draggable={isEditing}
              onDragStart={(e) => {
                if (!isEditing) return;
                e.dataTransfer.setData('text/plain', index.toString());
              }}
              onDragOver={(e) => {
                if (!isEditing) return;
                e.preventDefault();
              }}
              onDrop={(e) => {
                if (!isEditing) return;
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const toIndex = index;
                if (fromIndex === toIndex) return;

                handleDragEnd({
                  source: { index: fromIndex },
                  destination: { index: toIndex }
                });
              }}
            >
              <div className="song-content">
                {isEditing && (
                  <div className="drag-handle">
                    <MdDragIndicator size={20} />
                  </div>
                )}

                <Link
                  to={`/song?id=${item.id}`}
                  onClick={(e) => handleSongClick(e, item.id, isEditing)}
                  className="song-info"
                >
                  <h3>{item.title}</h3>
                  <p>{item.artist}</p>
                </Link>

                {isEditing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.id);
                    }}
                    className="delete-button"
                    aria-label="删除歌曲"
                  >
                    <MdClose size={18} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }, [data, isEditing, handleDragEnd, handleSongClick, handleRemove]);

  return (
    <>
      <div className="edit-control">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`edit-button ${isEditing ? 'active' : ''}`}
          title={isEditing ? '完成编辑' : '编辑列表'}
          aria-label={isEditing ? '完成编辑' : '编辑列表'}
        >
          {isEditing ? (
            <MdCheck size={20} className="edit-icon" />
          ) : (
            <MdEdit size={18} className="edit-icon" />
          )}
        </button>
        {isEditing && <span className="edit-hint">长按拖动歌曲排序</span>}
      </div>

      {isLoading ? (
        <p>加载中...</p>
      ) : data ? (
        songList
      ) : (
        <p>暂无数据</p>
      )}
    </>
  );
});

CurrentList.displayName = 'CurrentList';

export default CurrentList;