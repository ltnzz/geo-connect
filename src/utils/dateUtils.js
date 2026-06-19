export function isWithin24Hours(dateValue) {
  if (!dateValue) return false;

  const date = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return date >= twentyFourHoursAgo;
}

export function filterRecentEvents(events) {
  if (!events || !Array.isArray(events)) return [];
  return events.filter(event => isWithin24Hours(event.createdAt));
}
