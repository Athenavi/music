import React, {useState, useEffect, useCallback} from 'react';
import {Link} from 'react-router-dom';
import API_URL from '../../config';
import {MdDragIndicator, MdClose, MdEdit, MdCheck} from 'react-icons/md'; // 添加编辑图标
import PropTypes from 'prop-types';
import './CurrentList.css';

function CurrentList({pid, setMusicId, handleNextSong, toggleVisable}) {
    const [data, setData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // 获取播放列表数据
    const fetchData = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/userSongList?pid=${pid}`);
            const responseData = await res.json();
            const convertedData = convertData(responseData);
            setData(convertedData);
            localStorage.setItem('currentPlaylist', JSON.stringify(convertedData));
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }, [pid]);

    // 转换数据格式
    const convertData = (data) => ({
        "播放列表": data["播放列表"].map(([id, title, artist]) => ({
            id,
            title: title || "Unknown Title",
            artist: artist || "Unknown Artist",
        })),
    });

    // 初始化数据
    useEffect(() => {
        const cachedData = localStorage.getItem('currentPlaylist');
        if (cachedData) {
            setData(JSON.parse(cachedData));
        } else {
            fetchData();
        }
    }, [fetchData]);

    // 删除歌曲
    const handleRemove = (id) => {
        setData((prev) => {
            const updated = {
                ...prev,
                播放列表: prev.播放列表.filter((item) => item.id !== id),
            };
            localStorage.setItem('currentPlaylist', JSON.stringify(updated));
            return updated;
        });
    };


    // 修复拖拽样式问题
    const handleDragEnd = (result) => {
        if (!result.destination || !isEditing) return;

        const items = Array.from(data.播放列表);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const newData = {...data, 播放列表: items};
        setData(newData);
        localStorage.setItem('currentPlaylist', JSON.stringify(newData));
    };

    return (
        <>
            <div className="edit-control">
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`edit-button ${isEditing ? 'active' : ''}`}
                    title={isEditing ? '完成编辑' : '编辑列表'}
                >
                    {isEditing ? (
                        <MdCheck size={20} className="edit-icon"/>
                    ) : (
                        <MdEdit size={18} className="edit-icon"/>
                    )}
                </button>
                {isEditing && <span className="edit-hint">长按拖动歌曲排序</span>}
            </div>

            {data ? (
                <div onDragEnd={handleDragEnd}>
                    <div droppableId="playlist">
                        {(provided) => (
                            <ul
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="song-list"
                                style={{minHeight: 10}}
                            >
                                {data.播放列表.map((item, index) => (
                                    <div
                                        key={item.id}
                                        draggableId={String(item.id)}
                                        index={index}
                                        isDragDisabled={!isEditing}
                                    >
                                        {(provided, snapshot) => (
                                            <li
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`song-item ${
                                                    snapshot.isDragging ? 'dragging' : ''
                                                } ${isEditing ? 'editing' : ''}`}
                                            >
                                                <div className="song-content">
                                                    {isEditing && (
                                                        <div
                                                            {...provided.dragHandleProps}
                                                            className="drag-handle"
                                                        >
                                                            <MdDragIndicator size={20}/>
                                                        </div>
                                                    )}

                                                    <Link
                                                        to={`/song?id=${item.id}`}
                                                        onClick={(e) => {
                                                            if (isEditing) {
                                                                e.preventDefault();
                                                                return;
                                                            }
                                                            setMusicId(item.id);
                                                            handleNextSong(item.id);
                                                        }}
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
                                                        >
                                                            <MdClose size={18}/>
                                                        </button>
                                                    )}
                                                </div>
                                            </li>
                                        )}
                                    </div>
                                ))}
                                {provided.placeholder}
                            </ul>
                        )}
                    </div>
                </div>
            ) : (
                <p>加载中...</p>
            )}
        </>
    );
}

// PropTypes验证
CurrentList.propTypes = {
    pid: PropTypes.string.isRequired,
    setMusicId: PropTypes.func.isRequired,
    handleNextSong: PropTypes.func.isRequired,
    toggleVisable: PropTypes.func,
};

export default CurrentList;