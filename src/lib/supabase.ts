import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Complaint {
  id: string
  tracking_number: string
  name: string
  email: string
  category: string
  subject: string
  description: string
  status: string
  priority: string
  severity: string
  photo_url: string | null
  latitude: number | null
  longitude: number | null
  location_name: string | null
  upvote_count: number
  created_at: string
  updated_at: string
}

export interface DuplicateMatch {
  id: string
  tracking_number: string
  subject: string
  category: string
  upvote_count: number
  distance_meters: number
}

export type ComplaintInput = Omit<Complaint, 'id' | 'tracking_number' | 'status' | 'priority' | 'severity' | 'photo_url' | 'latitude' | 'longitude' | 'location_name' | 'upvote_count' | 'created_at' | 'updated_at'>

export const CATEGORIES = [
  'Roads & Infrastructure',
  'Water & Drainage',
  'Waste & Sanitation',
  'Street Lighting',
  'Public Safety',
  'Parks & Green Spaces',
  'Traffic & Transport',
  'Accessibility & Disability',
  'Other',
] as const

export const STATUSES = ['Pending', 'Under Review', 'Resolved', 'Rejected'] as const

export const SEVERITY_LEVELS = ['Critical', 'High', 'Medium', 'Low'] as const

export const SEVERITY_ORDER: Record<string, number> = {
  'Critical': 0,
  'High': 1,
  'Medium': 2,
  'Low': 3,
}

export const SEVERITY_COLORS: Record<string, string> = {
  'Critical': '#8b3a2a',
  'High': '#a96545',
  'Medium': '#c4976a',
  'Low': '#d4c4a8',
}

export function generateTrackingNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return `CMP-${code}`
}

/**
 * Determines a severity level from 'Critical' to 'Low' based on category,
 * subject, and description keywords. This is the AI-like heuristic that
 * ranks complaints on the bulletin board.
 */
export function assessSeverity(category: string, subject: string, description: string): string {
  const text = `${category} ${subject} ${description}`.toLowerCase()

  const criticalKeywords = [
    'danger', 'hazard', 'injury', 'unsafe', 'emergency', 'death', 'fatal',
    'poison', 'contaminat', 'allergic', 'suffocat', 'electric shock',
    'fire', 'explos', 'collapse', 'asbestos', 'toxic', 'biohazard',
    'attack', 'assault', 'threat', 'weapon', 'abuse', 'harassment',
  ]

  const highKeywords = [
    'fraud', 'scam', 'stolen', 'theft', 'refund refused', 'discrimination',
    'disability', 'accessibility', 'wheelchair', 'unable to access',
    'safety', 'health', 'sanitation', 'hygiene', 'mold', 'rotten',
    'expired', 'defective', 'broken', 'dangerous', 'illegal', 'lawsuit',
    'legal action', 'police', 'violence', 'intimidation', 'blackmail',
    'extortion', 'overcharged', 'bait and switch', 'no response',
    'urgent', 'immediate', 'medical', 'medication', 'contaminat',
    'allergen', 'recalled', 'lawsuit', 'attorney', 'lawyer',
  ]

  const mediumKeywords = [
    'delay', 'late', 'rude', 'unprofessional', 'poor quality',
    'defective', 'damaged', 'missing', 'wrong', 'incorrect',
    'billing', 'charge', 'overcharge', 'refund', 'cancel',
    'no response', 'ignored', 'mislead', 'misrepresent',
    'complaint ignored', 'disappointed', 'frustrated',
    'not as described', 'not as advertised', 'warranty',
    'guarantee', 'service', 'staff', 'delivery', 'quality',
    'defective product', 'faulty', 'malfunction',
  ]

  for (const kw of criticalKeywords) {
    if (text.includes(kw)) return 'Critical'
  }

  for (const kw of highKeywords) {
    if (text.includes(kw)) return 'High'
  }

  for (const kw of mediumKeywords) {
    if (text.includes(kw)) return 'Medium'
  }

  // Category-based defaults
  if (category === 'Accessibility & Disability') return 'High'
  if (category === 'Staff Behavior') return 'Medium'

  return 'Low'
}

/**
 * Uploads a photo to the complaint-photos storage bucket and returns the public URL.
 */
export async function uploadComplaintPhoto(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`
  const filePath = `${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('complaint-photos')
    .upload(filePath, file, { contentType: file.type })

  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage
    .from('complaint-photos')
    .getPublicUrl(filePath)

  return urlData.publicUrl
}

export async function findDuplicateComplaint(
  category: string,
  latitude: number,
  longitude: number,
  radiusMeters = 200,
): Promise<DuplicateMatch | null> {
  const { data, error } = await supabase.rpc('find_duplicate_complaint', {
    p_category: category,
    p_latitude: latitude,
    p_longitude: longitude,
    p_radius_meters: radiusMeters,
  })

  if (error) throw error
  if (!data || data.length === 0) return null
  return data[0] as DuplicateMatch
}

export async function upvoteComplaint(complaintId: string): Promise<number> {
  const { data, error } = await supabase.rpc('upvote_complaint', {
    p_complaint_id: complaintId,
  })

  if (error) throw error
  return data as number
}
