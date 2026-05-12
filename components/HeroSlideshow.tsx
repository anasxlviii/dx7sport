'use client';

import { useState, useEffect } from 'react';

const images = [
  '/hero/stadium.png',
  '/hero/player.png',
  '/hero/celebration.png'
];

export function HeroSlideshow() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      {images.map((img, idx) => (
        <div
          key={img}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentImage ? 'opacity-40' : 'opacity-0'
          }`}
        >
          <img
            src={img}
            alt="Soccer Background"
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      {/* Gradient Fade to Bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent z-10" />
    </div>
  );
}
