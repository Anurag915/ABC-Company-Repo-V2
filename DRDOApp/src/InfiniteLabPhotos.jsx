import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";

// Define the API URL from environment variables or fallback to localhost
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function InfiniteLabPhotos({ labId }) {
  const [photos, setPhotos] = useState([]);
  const limit = 10;
  const loadingRef = useRef(false);
  const containerRef = useRef(null);
  const autoSlideIntervalRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const autoSlideDelay = 3000;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // No fixed PHOTO_WIDTH or PHOTO_HEIGHT here.
  // The component will adapt to its parent's width.

  const loadPhotos = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);

    try {
      const res = await axios.get(
        `${apiUrl}/api/labs/${labId}/photos?limit=${limit}&sortBy=createdAt:desc`
      );
      setPhotos(res.data);
      setCurrentIndex(0);
    } catch (err) {
      console.error("Error loading photos:", err);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  };

  const scrollToIndex = useCallback(
    (index) => {
      if (!containerRef.current || photos.length === 0) return;

      // Get the actual width of the first photo element after rendering
      const firstPhotoElement = containerRef.current.querySelector('.photo-item');
      if (!firstPhotoElement) return; // Should not happen if photos.length > 0

      const photoWidth = firstPhotoElement.offsetWidth; // Get dynamic width
      const gapPx = parseFloat(getComputedStyle(containerRef.current).gap || "0px");
      const itemWidth = photoWidth + gapPx;

      containerRef.current.scrollTo({
        left: index * itemWidth,
        behavior: "smooth",
      });
    },
    [photos] // Depend on photos, as rendered elements' sizes might change
  );

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const totalItems = photos.length;
      if (totalItems === 0) return 0;

      const nextIndex = (prevIndex + 1) % totalItems;
      scrollToIndex(nextIndex);
      return nextIndex;
    });
  }, [photos.length, scrollToIndex]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const totalItems = photos.length;
      if (totalItems === 0) return 0;

      const prevIndexCalculated = (prevIndex - 1 + totalItems) % totalItems;
      scrollToIndex(prevIndexCalculated);
      return prevIndexCalculated;
    });
  }, [photos.length, scrollToIndex]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || photos.length === 0) return;

    if (autoSlideIntervalRef.current) {
      clearTimeout(autoSlideIntervalRef.current);
    }

    autoSlideIntervalRef.current = setTimeout(() => {
      const scrollLeft = containerRef.current.scrollLeft;
      const firstPhotoElement = containerRef.current.querySelector('.photo-item');
      if (!firstPhotoElement) return;

      const photoWidth = firstPhotoElement.offsetWidth; // Get dynamic width
      const gapPx = parseFloat(getComputedStyle(containerRef.current).gap || "0px");
      const itemWidth = photoWidth + gapPx;

      const newIndex = Math.round(scrollLeft / itemWidth);

      setCurrentIndex(Math.min(Math.max(0, newIndex), photos.length - 1));
    }, 150);
  }, [photos.length]);

  useEffect(() => {
    loadPhotos();
  }, [labId]);

  useEffect(() => {
    const startAutoSlide = () => {
      if (autoSlideIntervalRef.current) {
        clearInterval(autoSlideIntervalRef.current);
      }
      autoSlideIntervalRef.current = setInterval(() => {
        if (!isHovered && photos.length > 0) {
          handleNext();
        }
      }, autoSlideDelay);
    };
    startAutoSlide();
    return () => clearInterval(autoSlideIntervalRef.current);
  }, [isHovered, photos.length, handleNext, autoSlideDelay]);

  const renderedPhotos = useMemo(() => {
    return photos.map((photo, index) => (
      <div
        key={photo._id}
        className="photo-item" // Added class for easier selection in scrollToIndex
        style={{
          scrollSnapAlign: "center",
          flexShrink: 0,
          width: "100%", // Take 100% of the parent container's width
          aspectRatio: "16 / 9", // Maintain a widescreen aspect ratio
          minHeight: "200px", // Minimum height for smaller screens/containers
          maxHeight: "350px", // Maximum height to prevent excessive size
          position: "relative",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          willChange: "transform",
          transform: "translateZ(0)",
          backgroundColor: "#fff",
        }}
      >
        <img
          src={`${apiUrl}${photo.fileUrl}`}
          alt={photo.name}
          loading={index === 0 ? "eager" : "lazy"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            pointerEvents: "auto",
          }}
        />
      </div>
    ));
  }, [photos]);

  const navButtonStyle = useCallback(
    (side) => {
      // Get the actual width of the container to position buttons accurately
      const containerWidth = containerRef.current ? containerRef.current.offsetWidth : 0;
      const buttonOffset = 10; // Padding from the edge of the visible photo

      return {
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        [side === "left" ? "left" : "right"]: `calc(50% - ${containerWidth / 2}px + ${buttonOffset}px)`,
        zIndex: 10,
        background: "rgba(0,0,0,0.5)",
        color: "white",
        border: "none",
        borderRadius: "50%",
        width: "36px",
        height: "36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: "1.3rem",
        paddingBottom: "2px",
        opacity: isHovered ? 1 : 0,
        transition: "opacity 0.3s ease, background-color 0.3s ease",
        backdropFilter: "blur(3px)",
        "&:hover": {
          backgroundColor: "rgba(0,0,0,0.7)",
        },
      };
    },
    [isHovered]
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%", // Take full width of parent column
        minHeight: "280px", // Minimum height for the overall component (photo + dots)
        maxHeight: "420px", // Max height for the overall component
        margin: "0 auto", // Center horizontally, no vertical margin from this component
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div // This is the scrollable container for the images
        ref={containerRef}
        className="overflow-x-auto flex hide-scrollbar"
        style={{
          scrollSnapType: "x mandatory",
          scrollBehavior: "smooth",
          width: "100%", // Take 100% of its parent's width
          margin: "0 auto",
          padding: "0",
          gap: "0.5rem", // Small gap between photos
          position: "relative",
          minHeight: "200px", // Min height for the scrollable area
          maxHeight: "350px", // Max height for the scrollable area
          boxSizing: "content-box",
        }}
        tabIndex={0}
        onScroll={handleScroll}
      >
        {renderedPhotos}
        {isLoading && photos.length === 0 && (
          <div
            style={{
              scrollSnapAlign: "center",
              flexShrink: 0,
              width: "100%",
              aspectRatio: "16 / 9",
              minHeight: "200px",
              maxHeight: "350px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              color: "#666",
              backgroundColor: "#f8f8f8",
              borderRadius: "8px",
              opacity: 0.8,
            }}
          >
            Loading photos...
          </div>
        )}
        {!isLoading && photos.length === 0 && (
          <div
            style={{
              scrollSnapAlign: "center",
              flexShrink: 0,
              width: "100%",
              aspectRatio: "16 / 9",
              minHeight: "200px",
              maxHeight: "350px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.9rem",
              color: "#666",
              backgroundColor: "#f8f8f8",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              textAlign: "center",
              padding: "1rem",
            }}
          >
            <h3>No Photos Available</h3>
            <p>There are no photos to display for this lab.</p>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      {photos.length > 0 && (
        <>
          <button
            onClick={handlePrev}
            style={navButtonStyle("left")}
            aria-label="Previous photo"
          >
            {"<"}
          </button>
          <button
            onClick={handleNext}
            style={navButtonStyle("right")}
            aria-label="Next photo"
          >
            {">"}
          </button>
        </>
      )}

      {/* Dots */}
      {photos.length > 0 && (
        <div style={{ display: "flex", marginTop: "0.75rem", gap: "0.4rem" }}>
          {Array.from({ length: photos.length }).map((_, index) => (
            <span
              key={index}
              style={{
                width: currentIndex === index ? "9px" : "7px",
                height: currentIndex === index ? "9px" : "7px",
                borderRadius: "50%",
                backgroundColor: currentIndex === index ? "#333" : "#bbb",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onClick={() => {
                setCurrentIndex(index);
                scrollToIndex(index);
              }}
              aria-label={`Go to photo ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
