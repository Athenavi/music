import React, { useState, useEffect } from 'react';
import API_URL from '../../config';
function SideBar() {
    const [sidebarHtml, setSidebarHtml] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const deviceType = window.innerWidth <= 768 ? 'phone' : 'desket';

    useEffect(() => {
        async function fetchSidebarContent() {
            setIsLoading(true);
            try {
                const response = await fetch(API_URL+`/api/sidebar/?type=${deviceType}`);
                if (!response.ok) {
                    throw new Error('Network response was not OK');
                }
                const data = await response.json();
                setSidebarHtml(data.sidebar);
            } catch (error) {
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        }

        fetchSidebarContent();
    }, [deviceType]);

    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>Error loading sidebar: {error}</p>;

    return (
        <div dangerouslySetInnerHTML={{ __html: sidebarHtml }} />
    );
}

export default SideBar;