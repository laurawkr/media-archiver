// Original MediaCard.jsx
const MediaCard = ({ metadata, onMediaSelect }) => {
    const { thumbnail, title, uploader, upload_date } = metadata;

    return (
        <div
            className="media-card border rounded p-4 shadow-md"
            onClick={() => onMediaSelect(metadata)} // Pass metadata to play in the viewer
            style={{ cursor: 'pointer' }} // Make the card clickable
        >
            {thumbnail && (
                <img
                    src={thumbnail}
                    alt={title}
                    className="w-full max-w-xs h-32 object-cover"
                />
            )}
            <h3 className="text-lg font-bold mt-2">
            {title.length > 100 ? `${title.substring(0, 100)}...` : title}
            </h3>
            <p>{uploader}</p>
            <p>{upload_date}</p>
        </div>
    );
};

export default MediaCard;
