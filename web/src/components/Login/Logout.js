const Logout = () => {
  // 清除 Cookie 中的 token
  document.cookie = `token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  
  // 清除 localStorage 中的 token
  localStorage.removeItem('token');
};

export default Logout;
