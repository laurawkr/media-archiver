const renderContent = () => {
    switch (activeTab) {
        case "home":
            return <div>Home Content</div>;
        case "settings":
            return (
                <div>
                    <h2>Settings</h2>
                    <div>
                        <label>Root Storage Location:</label>
                        <input
                            type="text"
                            value={rootPath}
                            onChange={(e) => setRootPath(e.target.value)}
                            placeholder="/path/to/storage"
                        />
                        <button onClick={updateRootPath}>Save</button>
                    </div>
                </div>
            );
        default:
            return <div>Content Coming Soon</div>;
    }
};
