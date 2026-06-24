
/**
 * Checks whether a given date is within the last 24 hours from now.
 * 
 * @param {Date|Object} dateValue - The Date object or Firebase Timestamp.
 * @returns {boolean} True if the date is within the last 24 hours.
 */
export function isWithin24Hours(dateValue) {
  if (!dateValue) return false;

  const date = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return date >= twentyFourHoursAgo;
}


/**
 * Filters an array of events to only include those created within the last 24 hours,
 * and sorts them in descending order (newest first).
 * 
 * @param {Array<Object>} events - Array of event objects containing a `createdAt` property.
 * @returns {Array<Object>} Filtered and sorted array of events.
 */
export function filterRecentEvents(events) {
  if (!events || !Array.isArray(events)) return [];
  return events
    .filter(event => isWithin24Hours(event.createdAt))
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB - dateA;
    });
}


/**
 * Formats the start and end time of an event into a readable schedule string.
 * 
 * @param {Date|Object} startTime - The start time.
 * @param {Date|Object} endTime - The end time.
 * @returns {string} The formatted schedule string.
 */
export function formatEventSchedule(startTime, endTime) {
  if (!startTime) return '';

  const startD = startTime?.toDate ? startTime.toDate() : new Date(startTime);
  const endD = endTime?.toDate ? endTime.toDate() : (endTime ? new Date(endTime) : startD);

  const startDateStr = startD.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  const endDateStr = endD.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  const startTimeStr = startD.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const endTimeStr = endD.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  if (startDateStr === endDateStr) {
    return `${startDateStr}, ${startTimeStr} - ${endTimeStr}`;
  }
  return `${startDateStr} - ${endDateStr}\n${startTimeStr} - ${endTimeStr}`;
}


/**
 * Combines a Date object and a Time object into a single Date object.
 * 
 * @param {Date} date - The date part.
 * @param {Date} time - The time part.
 * @returns {Date} The combined Date object.
 */
export function combineDateTime(date, time) {
  if (!date || !time) return new Date();
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.getHours(),
    time.getMinutes()
  );
}


/**
 * Formats a given date into a human-readable relative time string (e.g., "just now", "5 minutes ago").
 * 
 * @param {Date|Object} dateValue - The Date or Firebase Timestamp.
 * @returns {string} The formatted relative time string.
 */
export function formatRelativeTime(dateValue) {
  if (!dateValue) return '';

  const date = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
  const now = new Date();
  const diffMs = now - date;

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) {
    return 'just now';
  }
  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
}

