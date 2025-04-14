export interface OrganizerUpcomingEvent {
  id: number;
  title: string;
  description?: string;
  category_id?: number;
  instance_id?: number;
  start_datetime?: string;
  end_datetime?: string;
  venue_id?: number;
  venue_name?: string;
  venue_city?: string;
  venue_state?: string;
  status?: string;
  instances?: Array<{
    id: number;
    date: string;
    start_time?: string;
    end_time?: string;
    capacity?: number;
    current_attendees?: number;
    is_soldout?: boolean;
    has_waitlist?: boolean;
  }>;
}

export interface Organizer {
  id: number;
  name: string;
  description?: string;
  website_url?: string;
  image_url?: string;
  email?: string;
  phone?: string;
  social_media?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  user_id: string;
  created_at: string;
  updated_at: string;
  upcoming_events?: OrganizerUpcomingEvent[];
} 