import React, { useState, useEffect } from 'react';
import URLInput from './components/URLInput';
import MediaLibrary from './components/MediaLibrary';

const App = () => {
    const [mediaList, setMediaList] = useState([]);

    // Define the fetchMediaList function in the appropriate scope
    const fetchMediaList = async () => {
        try {
            const response = await fetch('http://localhost:5000/list-media');
            if (response.ok) {
                const data = await response.json();
                setMediaList(data);
            } else {
                console.error("Failed to fetch media list.");
            }
        } catch (error) {
            console.error("Error fetching media list:", error);
        }
    };

    useEffect(() => {
        fetchMediaList(); // Fetch media list when the component mounts
    }, []);

    const handleURLSubmit = (url) => {
        // Refresh the media list after a delay to allow backend processing
        setTimeout(() => {
            fetchMediaList(); // Use the properly scoped fetchMediaList function
        }, 1000);
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Media Archiver</h1>
            <URLInput onSubmit={handleURLSubmit} />
            <MediaLibrary mediaList={mediaList} />
        </div>
    );
};

export default App;