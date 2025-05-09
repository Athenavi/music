import React, { useState, useEffect } from 'react';
import API_URL from '../../config';
import { Link } from "react-router-dom";
import { likeThisSong } from "../func/songMenu";

// 颜色常量
const colors = {
  primary: '#2d3436',
  secondary: '#636e72',
  accent: '#e84393',
  background: '#f5f6fa',
  text: '#2d3436',
  white: '#ffffff'
};

// 公共样式对象
const styles = {
  container: {
    padding: '2rem',
    minHeight: '80vh',
    backgroundColor: colors.background
  },
  title: {
    fontSize: '2rem',
    color: colors.primary,
    marginBottom: '2rem',
    fontWeight: '700',
    textAlign: 'center',
    position: 'relative',
    paddingBottom: '1rem',
    '&:after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '60px',
      height: '3px',
      backgroundColor: colors.accent
    }
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '2rem',
    padding: '1rem 0'
  },
  card: {
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    background: colors.white,
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: `0 10px 20px rgba(0,0,0,0.1)`
    }
  },
  image: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    borderBottom: `2px solid ${colors.accent}`
  },
  content: {
    padding: '1rem',
    textAlign: 'center'
  },
  songTitle: {
    fontSize: '1rem',
    color: colors.text,
    fontWeight: '600',
    margin: '0.5rem 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  meta: {
    color: colors.secondary,
    fontSize: '0.9rem'
  },
  likeButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'rgba(255,255,255,0.9)',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: colors.accent,
      color: colors.white
    }
  },
  loadMore: {
    margin: '2rem auto',
    padding: '0.8rem 2.5rem',
    background: `linear-gradient(135deg, ${colors.accent}, #ff7675)`,
    color: colors.white,
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'transform 0.3s ease',
    '&:hover': {
      transform: 'scale(1.05)'
    }
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px'
  },
  loadingDot: {
    width: '12px',
    height: '12px',
    margin: '0 4px',
    background: colors.accent,
    borderRadius: '50%',
    animation: 'bounce 1.4s infinite ease-in-out'
  },
  bottomAlert: {
    textAlign: 'center',
    color: colors.secondary,
    marginTop: '2rem',
    padding: '1rem',
    fontSize: '0.9rem'
  }
};

const PlayLists = ({ pageType }) => {
  const [data, setData] = useState(null);
  const [visibleData, setVisibleData] = useState([]);
  const [loadMoreCount] = useState(28);
  const [hoverIndex, setHoverIndex] = useState(null);

  useEffect(() => {
    fetch(API_URL + '/api/Recommend?pageType=' + pageType)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setVisibleData(data.slice(0, 25));
      })
      .catch(err => console.error('Error fetching data:', err));
  }, [pageType]);

  const loadMore = () => {
    setVisibleData(data.slice(0, visibleData.length + loadMoreCount));
  };

  const pageTitle = pageType === 'al' ? "专辑推荐" : "精选歌单";

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>{pageTitle}</h1>

      {visibleData.length > 0 ? (
        <>
          <div style={styles.grid}>
            {visibleData.map((item, index) => (
              <div
                key={index}
                style={styles.card}
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                <img
                  src={`${API_URL}/music_cover/${item[0]}.png`}
                  alt="封面"
                  style={styles.image}
                />
                <button
                  style={styles.likeButton}
                  onClick={() => likeThisSong(item[0])}
                >
                  ♥
                </button>

                <div style={styles.content}>
                  <Link
                    to={`/playlist?pid=${item[0]}&pageType=${pageType}&pTitle=${item[1]}&pRD=${item[2]}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <h3 style={styles.songTitle}>{item[1]}</h3>
                  </Link>
                  <p style={styles.meta}>{item[2]}</p>
                </div>
              </div>
            ))}
          </div>

          {visibleData.length < data?.length && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: colors.secondary, marginBottom: '1rem' }}>
                已加载 {visibleData.length} / {data.length}
              </p>
              <button
                onClick={loadMore}
                style={styles.loadMore}
              >
                加载更多
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={styles.loading}>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              style={{
                ...styles.loadingDot,
                animationDelay: `${i * 0.16}s`
              }}
            />
          ))}
        </div>
      )}

      <p style={styles.bottomAlert}>🎵 更多精彩内容正在筹备中，敬请期待！</p>
    </div>
  );
};

export default PlayLists;