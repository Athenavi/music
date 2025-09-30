const removeFromPlaylist = (id) => {
        let currentPlaylist = JSON.parse(localStorage.getItem('currentPlaylist')) || {"播放列表": []};
        let playlist = currentPlaylist['播放列表'];

        let indexToRemove = playlist.findIndex(item => item.id === id);

        if (indexToRemove === -1) {
            alert('该歌曲不在播放列表中');
            return;
        }

        playlist.splice(indexToRemove, 1);
        currentPlaylist['播放列表'] = playlist;
        localStorage.setItem('currentPlaylist', JSON.stringify(currentPlaylist));
        alert('移除成功');
    };

export default removeFromPlaylist;