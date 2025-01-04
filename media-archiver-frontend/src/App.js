import React, { useState } from 'react';
import URLInput from './components/URLInput';
import MediaCard from './components/MediaCard';

const App = () => {
    const [mediaList, setMediaList] = useState([]);

    const handleURLSubmit = (url) => {
        const newMedia = {
            title: "Sample Title",
            uploader: "Sample Uploader",
            upload_date: "2023-01-01",
            thumbnail: "https://via.placeholder.com/150",
        };
        setMediaList([...mediaList, newMedia]);
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Media Archiver</h1>
            <URLInput onSubmit={handleURLSubmit} />
            <div className="grid grid-cols-3 gap-4 mt-6">
                {mediaList.map((media, index) => (
                    <MediaCard key={index} metadata={media} />
                ))}
            </div>
        </div>
    );
};

export default App;
