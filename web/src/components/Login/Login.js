import React, {useState} from 'react';
import axiosInstance from '../../axiosInstance';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const login = async () => {
        try {
            const response = await axiosInstance.post('/login?username=' + username + '&pwd=' + password,
            );
            const {access_token} = response.data;
            document.cookie = `token=${access_token}`;
            localStorage.setItem('token', access_token);
            alert('登录成功')
        } catch (error) {
            if (error.response) {
                console.log(error.response.data);
            } else {
                console.log(error.message);
            }
        }
    }

    return (
        <div>
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}/>
            <input type="password" placeholder="Password" value={password}
                   onChange={(e) => setPassword(e.target.value)}/>
            <button onClick={login}>Login</button>
        </div>
    );
}

export default Login;