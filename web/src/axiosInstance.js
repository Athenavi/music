import axios from 'axios';
import API_URL from "./config";
import {useState} from "react";

const axiosInstance = axios.create({
    baseURL: API_URL,  // 设置基本URL
    headers: {
        'Content-Type': 'application/json',
    }
});

// 在请求发送前拦截器中添加JWT令牌
axiosInstance.interceptors.request.use(config => {
    const token = useState(localStorage.getItem('token') || null);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

export default axiosInstance;