import { useState } from 'react';
import './NFTThumbnail.css';

type NFTThumbnailProps = {
  src: string;
  alt: string;
  title?: string;
  className?: string;
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
};

export const NFTThumbnail = ({ src, alt, title, className, onError }: NFTThumbnailProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`nftthumb ${isLoaded ? 'nftthumb--loaded' : ''} ${className ?? ''}`}>
      <img
        src={src}
        alt={alt}
        title={title}
        className="nftthumb__image"
        onLoad={() => setIsLoaded(true)}
        onError={onError}
        loading="lazy"
      />
    </div>
  );
};
