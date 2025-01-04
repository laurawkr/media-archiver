import React from 'react';

const MediaCard = ({ metadata }) => (
    <div className="border rounded p-4 shadow-md">
        <img src={metadata.thumbnail} alt={metadata.title} className="w-full h-32 object-cover" />
        <h3 className="text-lg font-bold mt-2">{metadata.title}</h3>
        <p>{metadata.uploader}</p>
        <p>{metadata.upload_date}</p>
    </div>
);

export default MediaCard;