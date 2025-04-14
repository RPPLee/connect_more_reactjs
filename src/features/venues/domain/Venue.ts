export interface Venue {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  longitude: number | null;
  latitude: number | null;
  creator_organizer_id: number | null;
  aliases: string[] | null;
  is_checked: boolean;
}

export interface VenuesResponse {
  venues: Venue[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface VenueFilterParams {
  name?: string;
  city?: string;
  state?: string;
  limit?: number;
  offset?: number;
} 