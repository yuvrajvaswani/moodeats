function InfiniteScrollLoader({ loading, hasMore }) {
  if (loading) {
    return <div className="loading-pulse">Loading more recipes...</div>;
  }

  if (!hasMore) {
    return <div className="status-text">You reached the end of your feed.</div>;
  }

  return null;
}

export default InfiniteScrollLoader;
