import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
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
      const photoWidth = 500;
      const gapPx = parseFloat(getComputedStyle(containerRef.current).gap || "0px");
      const itemWidth = photoWidth + gapPx;

      containerRef.current.scrollTo({
        left: index * itemWidth,
        behavior: "smooth",
      });
    },
    [photos]
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
      const photoWidth = 500;
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
        style={{
          scrollSnapAlign: "center",
          flexShrink: 0,
          width: "500px",
          height: "300px",
          position: "relative",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          willChange: "transform",
          transform: "translateZ(0)",
          // No pointerEvents: "none" here on the photo wrapper itself
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
            pointerEvents: "auto", // Re-enable pointer events for the image itself
          }}
        />
      </div>
    ));
  }, [photos]);

  const navButtonStyle = useCallback(
    (side) => ({
      position: "absolute",
      // Calculate top position based on the fixed image height (300px)
      top: "calc(50% - 150px + 150px)", // 50% of the main container, then adjust
      transform: "translateY(-50%)", // Center vertically relative to its own height

      // Position relative to the *visible area* of the image container (500px width)
      [side === "left" ? "left" : "right"]: `calc(50% - 250px + 10px)`, // 50% of main container, minus half image width, plus some padding from edge
      // For the other side, if it's 'right', it will be `calc(50% + 250px - 50px)` for button width
      // Let's refine for clarity:
      ...(side === "left" && { left: 'calc(50% - 250px + 10px)' }), // 50% of 960px container, minus half photo width (250px), plus 10px for inner padding
      ...(side === "right" && { right: 'calc(50% - 250px + 10px)' }), // Same logic for right

      zIndex: 10,
      background: "rgba(0,0,0,0.5)",
      color: "white",
      border: "none",
      borderRadius: "50%",
      width: "40px",
      height: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      fontSize: "1.5rem",
      paddingBottom: "2px",
      opacity: isHovered ? 1 : 0,
      transition: "opacity 0.3s ease, background-color 0.3s ease",
      backdropFilter: "blur(3px)",
      "&:hover": {
        backgroundColor: "rgba(0,0,0,0.7)",
      },
    }),
    [isHovered]
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "960px",
        // The height of the main container should accommodate the images + dots
        minHeight: "350px", // 300px image height + some margin for dots
        margin: "2rem auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden", // Still hide overflow for the main component
      }}
      // Re-enable hover listener on the main container to show/hide buttons
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div // This is the scrollable container for the images
        ref={containerRef}
        className="overflow-x-auto flex hide-scrollbar"
        style={{
          scrollSnapType: "x mandatory",
          scrollBehavior: "smooth",
          width: "calc(500px + 2rem)", // Correct width (image + padding on both sides)
          margin: "0 auto", // Center the visible scroll area
          padding: "0 1rem", // Padding to show partial next/prev image
          gap: "1rem",
          position: "relative", // KEEP this for scrollSnapAlign to work reliably
          height: "300px", // Set fixed height
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
              width: "500px",
              height: "300px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
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
              width: "500px",
              height: "300px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
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

      {/* Navigation buttons moved back to the parent of containerRef */}
      {/* Their position will be absolute relative to the outermost div */}
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
        <div style={{ display: "flex", marginTop: "1.5rem", gap: "0.6rem" }}>
          {Array.from({ length: photos.length }).map((_, index) => (
            <span
              key={index}
              style={{
                width: currentIndex === index ? "12px" : "10px",
                height: currentIndex === index ? "12px" : "10px",
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