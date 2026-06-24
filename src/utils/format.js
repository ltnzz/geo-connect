
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';

  const date =
    typeof timestamp.toDate === 'function'
      ? timestamp.toDate()
      : new Date(timestamp);

  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return 'now';

  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr  = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (sec < 60)  return 'now';
  if (min < 60)  return `${min}m ago`;
  if (hr  < 24)  return `${hr}h ago`;
  if (day < 7)   return `${day}d ago`;

  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};


export const formatCount = (value = 0) => {
  if (value < 1000) return String(value);
  if (value < 1000000)
    return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${(value / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
};