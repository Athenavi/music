const musicId = localStorage.getItem('currentId') || 0;

export const likeThisSong = (songId: string): void => {
    alert(`收藏还未实现添加喜欢成功${musicId}`);
};

export const shareThisSong = (): void => {
    alert(`分享还未实现${musicId}`);
};

const downloadThisSong = (): void => {
    alert('下载任务已开启');
};

// 如果需要导出默认组件或其他内容，可以添加在这里
// const SongMenu: React.FC = () => {
//     return (
//         <div>
//             {/* 组件内容 */}
//         </div>
//     );
// };

// export default SongMenu;
