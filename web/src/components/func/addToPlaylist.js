const addToPlaylist = ({id, artist, title}) => {
    let currentPlaylist = JSON.parse(localStorage.getItem('currentPlaylist')) || {"播放列表": []};
    let playlist = currentPlaylist['播放列表'];

    let indexToAdd = playlist.findIndex(item => item.id === id);

    if (indexToAdd !== -1) {
        alert('已添加，请勿重复添加');
        return;
    }

    let newSong = {
        "id": id,
        "artist": artist,
        "title": title
    };

    currentPlaylist["播放列表"].push(newSong);

    localStorage.setItem('currentPlaylist', JSON.stringify(currentPlaylist));

    console.log(JSON.stringify(currentPlaylist));
    alert('添加成功');
}
export default addToPlaylist;