/**
 * Location data types
 */

export interface LocationData {
  id: number;
  name: string;
  address: string;
  phone?: string | null;
  website?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  category?: string | null;
  rating?: number;
  review_count?: number;
  response_rate?: number;
  photo_count?: number;
  post_count?: number;
  google_location_id?: string | null;
  last_updated?: Date | string;
}