export type UserRole = 'scientist' | 'lab_manager' | 'reviewer'
export type ExperimentStatus = 'In Progress' | 'Completed' | 'Pending Review' | 'On Hold'
export type ExperimentPriority = 'High' | 'Medium' | 'Low'
export type SampleStatus = 'Active' | 'Depleted' | 'Low Stock' | 'Quarantine'
export type ProtocolStatus = 'Approved' | 'Under Review' | 'Expired'
export type TimelineEventType = 'milestone' | 'data_collection' | 'analysis' | 'review' | 'note' | 'status_change'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  institution: string | null
  avatar_initials: string | null
  created_at: string
  updated_at: string
}

export interface Experiment {
  id: string
  name: string
  category: string
  phase: string | null
  status: ExperimentStatus
  priority: ExperimentPriority
  researcher_id: string | null
  researcher_name: string | null
  tags: string[]
  description: string | null
  hypothesis: string | null
  started_at: string | null
  due_date: string | null
  completed_at: string | null
  progress: number
  organization: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ExperimentTimelineEvent {
  id: string
  experiment_id: string
  title: string
  description: string | null
  event_type: TimelineEventType
  event_date: string
  created_by: string | null
  created_at: string
  profile?: Pick<Profile, 'full_name' | 'avatar_initials'>
}

export interface ExperimentDataFile {
  id: string
  experiment_id: string
  file_name: string
  file_size: number | null
  file_type: string | null
  storage_path: string
  description: string | null
  uploaded_by: string | null
  uploaded_at: string
  profile?: Pick<Profile, 'full_name'>
}

export interface LabNote {
  id: string
  title: string
  content: string
  experiment_id: string | null
  researcher_id: string | null
  tags: string[]
  has_attachments: boolean
  has_images: boolean
  created_at: string
  updated_at: string
  profile?: Pick<Profile, 'full_name' | 'avatar_initials'>
}

export interface Sample {
  id: string
  name: string
  type: string
  experiment_id: string | null
  batch: string | null
  volume: string | null
  concentration: string | null
  storage: string | null
  location: string | null
  status: SampleStatus
  expiry_month: string | null
  received_at: string | null
  quantity: number
  max_quantity: number
  patient_id: string | null
  organization: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Protocol {
  id: string
  title: string
  category: string
  version: string | null
  status: ProtocolStatus
  author_id: string | null
  author_name: string | null
  description: string | null
  content: string | null
  tags: string[]
  usage_count: number
  review_due: string | null
  starred: boolean
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      experiments: {
        Row: Experiment
        Insert: Omit<Experiment, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Experiment, 'id' | 'created_at'>>
      }
      experiment_timeline_events: {
        Row: ExperimentTimelineEvent
        Insert: Omit<ExperimentTimelineEvent, 'id' | 'created_at' | 'profile'>
        Update: Partial<Omit<ExperimentTimelineEvent, 'id' | 'created_at' | 'profile'>>
      }
      experiment_data_files: {
        Row: ExperimentDataFile
        Insert: Omit<ExperimentDataFile, 'id' | 'uploaded_at' | 'profile'>
        Update: Partial<Omit<ExperimentDataFile, 'id' | 'uploaded_at' | 'profile'>>
      }
      lab_notes: {
        Row: LabNote
        Insert: Omit<LabNote, 'created_at' | 'updated_at' | 'profile'>
        Update: Partial<Omit<LabNote, 'id' | 'created_at' | 'profile'>>
      }
      samples: {
        Row: Sample
        Insert: Omit<Sample, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Sample, 'id' | 'created_at'>>
      }
      protocols: {
        Row: Protocol
        Insert: Omit<Protocol, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Protocol, 'id' | 'created_at'>>
      }
    }
    Functions: {
      get_user_role: { Args: Record<never, never>; Returns: UserRole }
    }
  }
}
