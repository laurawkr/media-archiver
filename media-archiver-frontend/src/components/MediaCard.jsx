import React from 'react';

const MediaCard = ({ metadata }) => {
    const { thumbnail, title, uploader, upload_date, video_url } = metadata;

    return (
        <div className="border rounded p-4 shadow-md">
            {thumbnail && (
                <img src={thumbnail} alt={title} className="w-full h-32 object-cover" />
            )}
            <h3 className="text-lg font-bold mt-2">{title}</h3>
            <p>{uploader}</p>
            <p>{upload_date}</p>
            <a href={video_url} className="text-blue-500 underline mt-2 inline-block" target="_blank" rel="noopener noreferrer">
                View Video
            </a>
        </div>
    );
};

export default MediaCard;