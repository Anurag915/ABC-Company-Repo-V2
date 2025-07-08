import React, { useEffect, useState } from "react";
import axios from "axios";

const apiUri = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DocumentMarquee = () => {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const labRes = await axios.get(`${apiUri}/api/labs/only`);
        const labId = labRes.data._id;

        const res = await axios.get(`${apiUri}/api/labs/${labId}/documents`);
        const data = res.data;

        const formattedDocs = [
          ...(data.notices || []).map((doc) => ({
            ...doc,
            type: "Notice",
          })),
          ...(data.circulars || []).map((doc) => ({
            ...doc,
            type: "Circular",
          })),
        ];

        setDocuments(formattedDocs);
      } catch (err) {
        console.error("Failed to fetch documents:", err);
      }
    };

    fetchDocuments();
  }, []);

  if (documents.length === 0) {
    return (
      <div style={styles.banner}>
        No notices or circulars available.
      </div>
    );
  }

  return (
    <div style={styles.marqueeContainer}>
      <span style={styles.newsLabel}>News Flash:</span>
      <div style={styles.marqueeWrapper}>
        <div style={styles.marqueeContent}>
          {[...documents, ...documents].map((doc, idx) => (
            <a
              key={idx}
              href={`${apiUri}${doc.fileUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
              onMouseEnter={(e) =>
                (e.currentTarget.style.textDecoration = "underline")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.textDecoration = "none")
              }
            >
              {doc.type}: {doc.name}
            </a>
          ))}
        </div>
      </div>

      {/* Inline animation style */}
      <style>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};

// Reusable styles
const styles = {
  marqueeContainer: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    height: "40px",
    backgroundColor: "#FEF3C7", // yellow-100
    borderBottom: "1px solid #FBBF24", // yellow-400
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    fontFamily: "Segoe UI, sans-serif",
    fontWeight: "bold",
    color: "#B45309", // amber-700
    overflow: "hidden",
  },
  newsLabel: {
    marginRight: "1rem",
    // backgroundColor: "#FACC15", // amber-400
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "18px",
    boxShadow: "0 0 6px rgba(250, 204, 21, 0.7)",
    whiteSpace: "nowrap",
  },
  marqueeWrapper: {
    overflow: "hidden",
    flexGrow: 1,
    position: "relative",
    whiteSpace: "nowrap",
  },
  marqueeContent: {
    display: "inline-flex",
    whiteSpace: "nowrap",
    animation: "scroll-left 20s linear infinite",
  },
  link: {
    display: "inline-block",
    marginRight: "32px",
    color: "#2563EB", // blue-600
    textDecoration: "none",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  banner: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: "#FEF3C7",
    border: "1px solid #FBBF24",
    padding: "8px 16px",
    display: "flex",
    alignItems: "center",
    height: "40px",
    fontWeight: "bold",
    color: "#B45309",
    userSelect: "none",
    fontFamily: "sans-serif",
    justifyContent: "center",
  },
};

export default DocumentMarquee;
