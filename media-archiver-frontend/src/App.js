import React, { useState, useEffect } from 'react';
import URLInput from './components/URLInput';
import MediaLibrary from './components/MediaLibrary';
import VerticalMediaViewer from './components/VerticalMediaViewer';
import StandardMediaViewer from './components/StandardMediaViewer';

const App = () => {
    const [mediaList, setMediaList] = useState([]);
    const [selectedMedia, setSelectedMedia] = useState(null);

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
        fetchMediaList();
    }, []);

    const handleURLSubmit = (url) => {
        setTimeout(() => {
            fetchMediaList();
        }, 1000);
    };

    const handleMediaSelect = (media) => {
        setSelectedMedia(media);
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Media Archiver</h1>
            <URLInput onSubmit={handleURLSubmit} />
            <div className="media-viewers">
                {selectedMedia?.folder === 'TikTok' ? (
                    <VerticalMediaViewer media={selectedMedia} />
                ) : (
                    <StandardMediaViewer media={selectedMedia} />
                )}
            </div>
            <MediaLibrary mediaList={mediaList} onMediaSelect={handleMediaSelect} />
        </div>
    );
};

export default App;