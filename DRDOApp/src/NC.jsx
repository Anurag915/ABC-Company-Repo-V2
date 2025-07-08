import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Import the CSS file for the styling
import './NC.css';

function NC({ labId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Changed to 5 items per page as requested

  useEffect(() => {
    async function fetchData() {
      if (!labId) {
        setError("Lab ID is missing for notices/circulars.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null); // Clear previous errors
        const res = await fetch(`${apiUrl}/api/labs/${labId}`);
        if (!res.ok) throw new Error("Failed to fetch lab data");
        const lab = await res.json();

        const combined = [
          ...(lab.notices || []).map((item) => ({ ...item, type: "Notice", rawDate: item.createdAt || (item._id ? new Date(parseInt(item._id.substring(0, 8), 16) * 1000) : new Date(0)) })),
          ...(lab.circulars || []).map((item) => ({
            ...item,
            type: "Circular",
            rawDate: item.createdAt || (item._id ? new Date(parseInt(item._id.substring(0, 8), 16) * 1000) : new Date(0)),
          })),
        ];

        // Sort by creation date (newest first)
        const sortedItems = combined.sort((a, b) => {
            const dateA = new Date(a.rawDate);
            const dateB = new Date(b.rawDate);
            return dateB - dateA; // Descending order (latest first)
        });

        setItems(sortedItems);
        setCurrentPage(1); // Reset to first page when new data is loaded
      } catch (err) {
        console.error("Error fetching notices/circulars:", err);
        setError("Failed to load notices & circulars.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [labId]);

  // Calculate items for the current page
  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return items.slice(indexOfFirstItem, indexOfLastItem);
  }, [items, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(items.length / itemsPerPage);

  // Pagination handlers
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  // Determine which page numbers to display in the pagination bar
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 7; // e.g., First << 1 2 3 ... 9 >> Last
    const ellipsisThreshold = 2; // Number of pages to show around current page before ellipsis

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);

      // Show ellipsis if current page is far from the beginning
      if (currentPage > ellipsisThreshold + 1) {
        pageNumbers.push('...');
      }

      // Determine start and end for the middle range of pages
      let startPage = Math.max(2, currentPage - ellipsisThreshold);
      let endPage = Math.min(totalPages - 1, currentPage + ellipsisThreshold);

      // Adjust range if near beginning or end
      if (currentPage <= ellipsisThreshold + 1) {
        endPage = Math.min(totalPages - 1, maxPagesToShow - 1);
      } else if (currentPage >= totalPages - ellipsisThreshold) {
        startPage = Math.max(2, totalPages - maxPagesToShow + 2);
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Show ellipsis if current page is far from the end
      if (currentPage < totalPages - ellipsisThreshold) {
        pageNumbers.push('...');
      }

      // Always show last page, but only if it's not already included
      if (!pageNumbers.includes(totalPages)) {
         pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };


  // --- Loading State UI ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Loading notices...</p>
      </div>
    );
  }

  // --- Error State UI ---
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-600 bg-red-50 rounded-lg p-4 text-center border border-red-200">
        <p className="font-semibold text-lg mb-2">Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // --- Empty State UI ---
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
        <p className="text-lg font-medium mb-2">No recent items</p>
        <p className="text-sm">Check back for updates!</p>
      </div>
    );
  }

  // --- Main Content UI ---
  return (
    <div className="w-full h-full relative flex flex-col"> {/* Added flex-col to stack list and pagination */}
      <div className="nc-list-container flex-grow"> {/* Container for the list items */}
        <ul className="list-none p-0 m-0">
          {currentItems.map((itemData) => {
            const formattedDate = itemData.rawDate ? new Date(itemData.rawDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
            const fullTitle = `${itemData.name || 'Untitled'} (${itemData.type || 'Item'}) - ${formattedDate}${itemData.description ? ` - ${itemData.description}` : ''}`;
            const isNew = (new Date() - new Date(itemData.rawDate)) < (30 * 24 * 60 * 60 * 1000); // "New" if less than 30 days old

            return (
              <li key={itemData._id} className="nc-scroll-item">
                <a href={`${apiUrl}${itemData.fileUrl}`} target="_blank" rel="noopener noreferrer" 
                   className="group"
                   title={fullTitle}>
                    <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-base group-hover:underline truncate pr-2 flex-grow">
                            {isNew && <span className="nc-new-tag mr-2">New</span>} {/* "New" tag */}
                            {itemData.name}
                        </span>
                        {itemData.rawDate && <span className="text-xs text-gray-400 flex-shrink-0">{formattedDate}</span>}
                    </div>
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="nc-pagination">
          <button
            onClick={goToFirstPage}
            className={`nc-pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
            disabled={currentPage === 1}
            aria-label="First page"
          >
            First
          </button>
          <button
            onClick={goToPrevPage}
            className={`nc-pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            &laquo;
          </button>
          {getPageNumbers().map((pageNumber, index) => (
            <button
              key={index} // Using index as key for ellipsis, actual page numbers will be unique
              onClick={() => typeof pageNumber === 'number' && handlePageChange(pageNumber)}
              className={`nc-pagination-button ${currentPage === pageNumber ? 'active' : ''} ${typeof pageNumber !== 'number' ? 'disabled' : ''}`}
              disabled={typeof pageNumber !== 'number'} // Disable ellipsis button
              aria-label={typeof pageNumber === 'number' ? `Page ${pageNumber}` : 'Ellipsis'}
            >
              {pageNumber}
            </button>
          ))}
          <button
            onClick={goToNextPage}
            className={`nc-pagination-button ${currentPage === totalPages ? 'disabled' : ''}`}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            &raquo;
          </button>
          <button
            onClick={goToLastPage}
            className={`nc-pagination-button ${currentPage === totalPages ? 'disabled' : ''}`}
            disabled={currentPage === totalPages}
            aria-label="Last page"
          >
            Last
          </button>
        </div>
      )}
    </div>
  );
}

export default NC;
