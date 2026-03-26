
export interface FriendRating {
  name: string;
  avatar: string;
  rating: number;
}

export interface Restaurant {
  id: string;
  name: string;
  country: string;
  address: string;
  imageUrl: string;
  specialty: string;
  description: string;
  rating?: number;
  friendRatings?: FriendRating[];
}

export type RatingsState = Record<string, number>;

