import React, { useState } from 'react';

const URLInput = ({ onSubmit }) => {
    const [url, setUrl] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(url);
        setUrl("");
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-4 p-4">
            <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter media URL"
                className="border p-2 flex-grow"
                required
            />
            <button type="submit" className="bg-blue-500 text-white p-2 rounded">Download</button>
        </form>
    );
};

export default URLInput;