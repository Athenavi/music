create table artists
(
    ArtistID   int auto_increment
        primary key,
    Name       varchar(255) null comment '艺术家姓名',
    Bio        text         null comment '艺术家简介',
    DebutDate  date         null comment '出道日期',
    Country    varchar(255) null comment '国家',
    CreateTime datetime     null comment '创建时间',
    UpdateTime datetime     null comment '更新时间'
);

create table albums
(
    AlbumID        int auto_increment
        primary key,
    Title          varchar(255) null comment '专辑标题',
    ArtistID       int          null comment '艺术家ID',
    ReleaseDate    date         null comment '发行日期',
    Genre          varchar(100) null comment '音乐类型',
    CoverImagePath varchar(255) null comment '封面图片路径',
    CreateTime     datetime     null comment '创建时间',
    UpdateTime     datetime     null comment '更新时间',
    constraint albums_ibfk_1
        foreign key (ArtistID) references artists (ArtistID)
);

create index ArtistID
    on albums (ArtistID);

create table hot
(
    HotID      int auto_increment
        primary key,
    TargetID   int                                          null comment '目标ID',
    Type       enum ('SONG', 'ARTIST', 'ALBUM', 'PLAYLIST') null comment '类型',
    Position   int                                          null comment '位置',
    UpdateTime timestamp                                    null comment '更新时间',
    constraint unique_target_type
        unique (TargetID, Type)
);

create table musictags
(
    TagID   int auto_increment
        primary key,
    TagName varchar(255) null comment '标签名称',
    constraint TagName
        unique (TagName)
);

create table songs
(
    SongID         int auto_increment
        primary key,
    Title          varchar(255) null comment '歌曲标题',
    ArtistID       int          null comment '艺术家ID',
    AlbumID        int          null comment '专辑ID',
    Genre          varchar(100) null comment '音乐类型',
    Duration       int          null comment '时长（秒）',
    ReleaseDate    date         null comment '发行日期',
    FilePath       varchar(255) null comment '歌曲文件存储路径',
    CoverImagePath varchar(255) null comment '封面图片路径',
    Lyrics         text         null comment '歌词',
    Language       varchar(50)  null comment '语言',
    PlayCount      int          null comment '播放次数',
    CreateTime     datetime     null comment '创建时间',
    UpdateTime     datetime     null comment '更新时间',
    AlbumArtist    varchar(255) null comment '专辑艺术家',
    Year           year         null comment '年份',
    TrackNumber    int          null comment '曲目编号',
    DiscNumber     int          null comment '唱片编号',
    Composer       varchar(255) null comment '作曲家',
    Lyricist       varchar(500) null comment '作词人',
    Comments       text         null comment '评论',
    BitDepth       int          null comment '位深',
    Channels       int          null comment '声道数',
    SampleRate     int          null comment '采样率',
    Bitrate        int          null comment '比特率',
    constraint songs_ibfk_1
        foreign key (ArtistID) references artists (ArtistID),
    constraint songs_ibfk_2
        foreign key (AlbumID) references albums (AlbumID)
);

create index AlbumID
    on songs (AlbumID);

create index ArtistID
    on songs (ArtistID);

create index idx_title
    on songs (Title);

create table songtags
(
    SongID int not null comment '歌曲ID',
    TagID  int not null comment '标签ID',
    primary key (SongID, TagID),
    constraint songtags_ibfk_1
        foreign key (SongID) references songs (SongID)
            on delete cascade,
    constraint songtags_ibfk_2
        foreign key (TagID) references musictags (TagID)
            on delete cascade
);

create index TagID
    on songtags (TagID);

create table users
(
    UserID                        int auto_increment
        primary key,
    Username                      varchar(255)                     null comment '用户名',
    Password                      varchar(255)                     null comment '密码',
    Email                         varchar(255)                     null comment '邮箱',
    Mobile                        varchar(20)                      null comment '手机',
    CreatedTime                   timestamp                        null comment '创建时间',
    UpdatedTime                   timestamp                        null comment '更新时间',
    LastLoginTime                 timestamp                        null comment '最后登录时间',
    Status                        tinyint                          null comment '状态',
    Role                          varchar(50)                      null comment '角色',
    Nickname                      varchar(255)                     null comment '昵称',
    Avatar                        varchar(255)                     null comment '头像',
    Gender                        enum ('Male', 'Female', 'Other') null comment '性别',
    Birthday                      date                             null comment '生日',
    Country                       varchar(255)                     null comment '国家',
    City                          varchar(255)                     null comment '城市',
    Bio                           text                             null comment '个人简介',
    TwoFactorAuthenticationStatus tinyint                          null comment '双因素认证状态',
    constraint Email
        unique (Email),
    constraint Mobile
        unique (Mobile)
);

create table comments
(
    CommentID       int auto_increment
        primary key,
    SongID          int          null comment '歌曲ID',
    UserID          int          null comment '用户ID',
    ParentCommentID int          null comment '父评论ID',
    Content         text         null comment '评论内容',
    ImageURL        varchar(255) null comment '图片URL',
    LikesCount      int          null comment '点赞数',
    MentionedUsers  text         null comment '被提及用户的ID',
    CreateTime      datetime     null comment '创建时间',
    UpdateTime      datetime     null comment '更新时间',
    constraint comments_ibfk_1
        foreign key (SongID) references songs (SongID),
    constraint comments_ibfk_2
        foreign key (UserID) references users (UserID)
);

create index SongID
    on comments (SongID);

create index UserID
    on comments (UserID);

create table follows
(
    FollowID   int auto_increment
        primary key,
    UserID     int                                          null comment '用户ID',
    TargetID   int                                          null comment '目标ID',
    Type       enum ('USER', 'ARTIST', 'ALBUM', 'PLAYLIST') null comment '类型',
    CreateTime timestamp                                    null comment '创建时间',
    constraint unique_follow
        unique (UserID, TargetID, Type),
    constraint follows_ibfk_1
        foreign key (UserID) references users (UserID)
);

create table message
(
    MessageID      int auto_increment
        primary key,
    SenderID       int        null comment '发送者ID',
    ReceiverID     int        null comment '接收者ID',
    MessageContent text       null comment '消息内容',
    SentTime       datetime   null comment '发送时间',
    IsRead         tinyint(1) null comment '是否已读',
    constraint message_ibfk_1
        foreign key (SenderID) references users (UserID)
            on delete cascade,
    constraint message_ibfk_2
        foreign key (ReceiverID) references users (UserID)
            on delete cascade
);

create index ReceiverID
    on message (ReceiverID);

create index SenderID
    on message (SenderID);

create table notifications
(
    NotificationID int auto_increment
        primary key,
    UserID         int                        null comment '用户ID',
    Type           enum ('MENTION', 'SYSTEM') null comment '类型',
    Content        text                       null comment '内容',
    IsRead         tinyint                    null comment '是否已读',
    ReferenceID    int                        null comment '参考ID',
    CreateTime     datetime                   null comment '创建时间',
    constraint notifications_ibfk_1
        foreign key (UserID) references users (UserID)
);

create index UserID
    on notifications (UserID);

create table playlists
(
    PlaylistID  int auto_increment
        primary key,
    UserID      int          null comment '用户ID',
    Name        varchar(255) null comment '播放列表名称',
    Description text         null comment '描述',
    Public      tinyint(1)   null comment '是否公开',
    CreateTime  timestamp    null comment '创建时间',
    UpdateTime  timestamp    null comment '更新时间',
    constraint playlists_ibfk_1
        foreign key (UserID) references users (UserID)
);

create table playlist_songs
(
    PlaylistSongID int auto_increment
        primary key,
    PlaylistID     int null comment '播放列表ID',
    SongID         int null comment '歌曲ID',
    constraint playlist_songs_ibfk_1
        foreign key (PlaylistID) references playlists (PlaylistID)
            on update cascade on delete cascade,
    constraint playlist_songs_ibfk_2
        foreign key (SongID) references songs (SongID)
            on update cascade on delete cascade
);

create index PlaylistID
    on playlist_songs (PlaylistID);

create index SongID
    on playlist_songs (SongID);

create index UserID
    on playlists (UserID);

create table useractivitylogs
(
    ID                  int auto_increment
        primary key,
    UserID              int          null comment '用户ID',
    ActivityType        varchar(100) null comment '活动类型',
    ActivityDescription text         null comment '活动描述',
    IPAddress           varchar(45)  null comment 'IP地址',
    Timestamp           datetime     null comment '时间戳',
    constraint useractivitylogs_ibfk_1
        foreign key (UserID) references users (UserID)
            on delete cascade
);

create index UserID
    on useractivitylogs (UserID);

create index idx_username
    on users (Username);

create table vips
(
    VIPID         int auto_increment
        primary key,
    UserID        int      null comment '用户ID',
    VIPLevel      int      null comment 'VIP等级',
    VIPPoints     int      null comment 'VIP积分',
    StartDate     datetime null comment '开始日期',
    EndDate       datetime null comment '结束日期',
    RenewalStatus tinyint  null comment '续订状态',
    SpecialNotes  text     null comment '特别备注',
    constraint UserID
        unique (UserID),
    constraint vips_ibfk_1
        foreign key (UserID) references users (UserID)
);

