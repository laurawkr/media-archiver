import React, { useState } from 'react';
import URLInput from './components/URLInput';
import MediaLibrary from './components/MediaLibrary';

const App = () => {
    const [mediaList, setMediaList] = useState([]);

    const handleURLSubmit = (media) => {
        setMediaList([...mediaList, media]);
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
