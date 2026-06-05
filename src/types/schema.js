export const USER_FIELDS = [
  'name',
  'username',
  'email',
  'photoURL',
  'bio',
  'isPrivate',
  'locationSharing',
  'invisibleMode',
  'createdAt',
  'updatedAt',
];

export const POST_FIELDS = [
  'userId',
  'caption',
  'imageUrl',
  'visibility',
  'location',
  'venueId',
  'likeCount',
  'commentCount',
  'createdAt',
];

export const LOCATION_FIELDS = [
  'latitude',
  'longitude',
  'geohash',
  'address',
  'city',
  'privacyLevel',
];

export const COLLECTIONS = {
  users: 'users',
  posts: 'posts',
  venues: 'venues',
  checkIns: 'checkIns',
  events: 'events',
  eventParticipants: 'eventParticipants',
  likes: 'likes',
  comments: 'comments',
  follows: 'follows',
  notifications: 'notifications',
  locationHistories: 'locationHistories',
};

export const USER_DEFAULTS = {
  isPrivate: false,
  locationSharing: false,
  invisibleMode: false,
};

export const LOCATION_PRIVACY_LEVELS = {
  exact: 'exact',
  approximate: 'approximate',
  hidden: 'hidden',
};
