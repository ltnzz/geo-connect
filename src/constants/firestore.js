export const COLLECTIONS = Object.freeze({
  users: 'users',
  userLocations: 'userLocations',
  sharedLocations: 'sharedLocations',
  posts: 'posts',
  follows: 'follows',
  categories: 'categories',
  places: 'places',
  checkins: 'checkins',
  events: 'events',
  eventPromptLogs: 'eventPromptLogs',
  notifications: 'notifications',
  reports: 'reports',
  blocks: 'blocks',
});

export const SUBCOLLECTIONS = Object.freeze({
  comments: 'comments',
  likes: 'likes',
  bookmarks: 'bookmarks',
  pushTokens: 'pushTokens',
  registrations: 'registrations',
  participants: 'participants',
  checkins: 'checkins',
  stories: 'stories',
  declines: 'declines',
});

export const NOTIFICATION_TYPES = Object.freeze({
  comment: 'comment',
  like: 'like',
  follow: 'follow',
});

export const LOCATION_SHARING = Object.freeze({
  exact: 'exact',
  neighborhood: 'neighborhood',
  city: 'city',
  hidden: 'hidden',
});

export const POST_LOCATION_VISIBILITY = Object.freeze({
  exact: 'exact',
  blurred: 'blurred',
  city: 'city',
  hidden: 'hidden',
});

export const EVENT_STATUS = Object.freeze({
  upcoming: 'upcoming',
  ongoing: 'ongoing',
  ended: 'ended',
  cancelled: 'cancelled',
});

export const createFollowId = (followerId, followingId) => `${followerId}_${followingId}`;

export const createBlockId = (blockerId, blockedId) => `${blockerId}_${blockedId}`;
