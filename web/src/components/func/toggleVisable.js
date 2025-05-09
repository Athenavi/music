const toggleVisible = (id) => {
    const element = document.getElementById(id);
    const songElement = document.getElementById('song');
    const elementDisplay = window.getComputedStyle(element).display;

    if (elementDisplay === 'none') {
        element.style.display = 'block';
        if (id === 'lrc_div') songElement.style.width = '55%';
    } else {
        element.style.display = 'none';
        if (id === 'lrc_div') songElement.style.width = '40%';
    }
};

export default toggleVisible;