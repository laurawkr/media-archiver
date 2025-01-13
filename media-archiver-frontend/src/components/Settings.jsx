const renderContent = () => {
    switch (activeTab) {
        case "home":
            return <div>Home Content</div>;
        case "settings":
            return (
                <div className={`settings-container ${isDarkMode ? 'dark-theme' : ''}`}>
                    <h2>Settings</h2>
                    <label>
                    Dark Mode:
                    <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>
                        {isDarkMode ? 'ON' : 'OFF'}
                    </span>
                    <input
                        type="checkbox"
                        checked={isDarkMode}
                        onChange={toggleTheme}
                    />
                    </label>
                    <label>
                    Root Storage Location:
                    <span style={{ marginLeft: '10px', color: 'grey' }}>
                        {rootPath || 'No path set'}
                    </span>
                    <input
                        type="text"
                        value={rootPath}
                        onChange={(e) => setRootPath(e.target.value)}
                        placeholder="Enter new root path"
                    />
                    </label>
                    <button onClick={updateRootPath}>Save</button>
                </div>
            );
        default:
            return <div>Content Coming Soon</div>;
    }
};
