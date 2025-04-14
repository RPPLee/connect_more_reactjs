export interface Event {
  // Event properties
  event_id: number;
  name?: string | null;
  description?: string;
  summary?: string;
  organizer_id: number;
  organizer_name?: string;
  organizer_contact_phone?: string;
  organizer_website_url?: string;
  category_id?: number;
  category_name?: string;
  subcategory_id?: number;
  subcategory_name?: string;
  image_url?: string;
  thumbnail_url?: string;
  video_url?: string;
  recurrence?: string;
  is_featured: boolean;
  is_super_featured?: boolean;
  venue_id?: number;
  venue_name?: string;
  venue_address?: string;
  venue_city?: string;
  venue_state?: string;
  venue_postal_code?: string;
  venue_lat?: number;
  venue_lng?: number;
  created_at?: string | null;
  updated_at?: string | null;
  status?: string | null;
  
  // Additional properties for event creation/editing
  is_private?: boolean;
  is_free?: boolean;
  is_hybrid?: boolean;
  custom_venue_name?: string;
  
  // Instance properties
  instance_id?: number;
  instance_date?: string;
  start_time?: string;
  end_time?: string;
  instance_summary?: string | null;
  instance_description?: string | null;
  instance_name?: string | null;
  instance_venue_id?: number | null;
  instance_status?: string | null;
  status_id?: number | null;
  registration_count?: number;
  max_attendees?: number | null;
  waitlist_count?: number;
  is_full?: boolean;
  allow_waitlist?: boolean;
  
  // Additional properties
  tags?: TagReference[];
  tag_names?: string[];
  tag_ids?: number[];
  flags?: Flag[];
  instance_attendees?: Attendee[];
  
  // For backward compatibility
  id?: number;
  title?: string;  // Will map to name or instance_name
  instances?: EventInstance[];
  is_virtual?: boolean;
  virtual_url?: string;
  tickets_available?: boolean;
  currency?: string;
  price?: number;
  capacity?: number;
}

export interface TagReference {
  tag_id: number;
  tag_name: string;
}

export interface Flag {
  id: number;
  flag: string;
}

export interface Attendee {
  id: number;
  user_id: number;
  name: string;
  email: string;
  status: string;
}

export interface EventInstance {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  capacity?: number;
  current_attendees?: number;
  is_soldout?: boolean;
  has_waitlist?: boolean;
  waitlist_count?: number;
  instance_name?: string | null;
  instance_description?: string | null;
  instance_venue_id?: number | null;
}

export interface EventCategory {
  id: number;
  category_name: string;
}

export interface EventSubcategory {
  id: number;
  category_id: number;
  subcategory_name: string;
}

export interface EventFilterParams {
  search?: string;
  category_id?: number;
  organizer_id?: number | string;
  venue_id?: number;
  city?: string;
  state?: string;
  postal_code?: string;
  date_start?: string;
  date_end?: string;
  is_featured?: boolean;
  is_virtual?: boolean;
  upcoming?: boolean;
  past?: boolean;
  limit?: number;
  offset?: number;
  latitude?: number;
  longitude?: number;
  distance?: number;
  homepage?: boolean;
} 