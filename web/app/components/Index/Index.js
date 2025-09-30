import React, {useState, useEffect} from 'react';
import API_URL from '../../config';

const Index = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        // 获取用户的UserAgent
        const userAgent = navigator.userAgent;

        fetch('https://api.7trees.cn/ip')
            .then(res => res.json())
            .then(ipData => {
                // 获取到的IP地址
                const userIP = ipData.ip;

                // 发送用户IP和UserAgent到后端
                fetch(API_URL + '/api/count_users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({userIP, userAgent})
                })
                    .then(res => res.json())
                    .then(data => setData(data))
                    .catch(error => console.error('Error:', error));
            })
            .catch(error => console.error('Error:', error));
    }, []);

    return (
        <div>
            {/* 根据需要渲染数据 */}
            {data && <div>{data}</div>}
        </div>
    );
};

export default Index;