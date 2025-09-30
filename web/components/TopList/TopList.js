"use client"

import { useState, useEffect } from "react"
import API_URL from "@/lib/config"
import addToPlaylist from "../func/addToPlaylist"
import removeFromPlaylist from "../func/removeFromPlaylist"
import { FiMusic, FiHeart, FiPlus, FiTrash2, FiShare2, FiChevronDown, FiAlertCircle } from "react-icons/fi"
import "./Toplist.css"

const TopList = () => {
  const [data, setData] = useState(null)
  const [visibleData, setVisibleData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadMoreCount] = useState(30)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL + "/api/toplist")
        if (!response.ok) throw new Error("数据加载失败")
        const data = await response.json()
        setData(data)
        setVisibleData(data.slice(0, loadMoreCount))
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const loadMore = () => {
    setVisibleData(data.slice(0, visibleData.length + loadMoreCount))
  }

  const likeThisSong = (id) => {
    // Implementation for liking a song
  }

  const shareThisSong = (id) => {
    // Implementation for sharing a song
  }

  return (
    <div className="toplist-container">
      <header className="toplist-header">
        <h1 className="toplist-title">
          <FiMusic className="title-icon" />
          热门排行榜
        </h1>
      </header>

      {loading ? (
        <div className="loading-state">
          <FiMusic className="loading-icon spin" />
          <p>正在加载榜单...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <FiAlertCircle className="error-icon" />
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="toplist-grid">
            {visibleData.map((item, index) => (
              <div key={index} className="song-card">
                <div className="card-rank">{index + 1}</div>
                <div className="card-media">
                  <img
                    className="card-image"
                    src={`${API_URL}/music_cover/${item[0]}.png`}
                    alt={item[2]}
                    loading="lazy"
                  />
                  <div className="card-overlay">
                    <button
                      className="control-button play-button"
                      onClick={() =>
                        addToPlaylist({
                          id: item[0],
                          artist: item[1],
                          title: item[2],
                        })
                      }
                    >
                      <FiPlus />
                    </button>
                  </div>
                </div>
                <div className="card-content">
                  {/* Implementation for song title and artist */}
                  <a href={`/song?id=${item[0]}`} className="song-title">
                    {item[2]}
                  </a>
                  <p className="song-artist">{item[1]}</p>
                </div>
                <div className="card-actions">
                  <button className="action-button like-button" onClick={() => likeThisSong(item[0])} aria-label="喜欢">
                    <FiHeart />
                  </button>
                  <button
                    className="action-button share-button"
                    onClick={() => shareThisSong(item[0])}
                    aria-label="分享"
                  >
                    <FiShare2 />
                  </button>
                  <button
                    className="action-button remove-button"
                    onClick={() => removeFromPlaylist(item[0])}
                    aria-label="移除"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {visibleData.length < data.length && (
            <div className="load-more-section">
              <button onClick={loadMore} className="load-more-button">
                加载更多 <FiChevronDown />
                <span className="progress-text">
                  ({visibleData.length}/{data.length})
                </span>
              </button>
            </div>
          )}

          <footer className="explore-footer">
            <FiMusic className="footer-icon" />
            <p>前面的区域，以后再来探索吧！</p>
          </footer>
        </>
      )}
    </div>
  )
}

export default TopList
