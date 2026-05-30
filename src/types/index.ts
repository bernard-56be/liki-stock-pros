export type UserRole = 'owner' | 'employee' | 'pending';

export interface UserProfile {
  id: string;
  full_name: string;
  phone_number: string | null;
  role: UserRole;
  boutique_id: string | null;
  updated_at: string;
}