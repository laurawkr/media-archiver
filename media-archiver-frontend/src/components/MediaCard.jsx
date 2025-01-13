const MediaCard = ({ metadata, onMediaSelect, isDarkMode }) => {
    const { thumbnail, title, uploader, upload_date } = metadata;

    return (
        <div
            className={`media-card border rounded p-4 shadow-md ${isDarkMode ? 'dark-theme' : ''}`}
            onClick={() => onMediaSelect(metadata)} // Pass metadata to play in the viewer
            style={{ cursor: 'pointer' }} // Make the card clickable
            role="button" // Add accessibility role
            tabIndex={0} // Make it focusable
            onKeyDown={(e) => e.key === 'Enter' && onMediaSelect(metadata)} // Support keyboard navigation
        >
            {thumbnail && (
                <img
                    src={thumbnail}
                    alt={title || "Media thumbnail"} // Add fallback for alt text
                    className="w-full max-w-xs h-32 object-cover"
                />
            )}
            <h3 className="text-lg font-bold mt-2">
                {title.length > 50 ? `${title.substring(0, 50)}...` : title}
            </h3>
            <p>{uploader}</p>
            <p>{upload_date}</p>
        </div>
    );
};

export default MediaCard;