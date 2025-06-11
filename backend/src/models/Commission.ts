export interface Commission {
  id: number;
  name: string;
  description: string;
  max_members: number;
  current_members: number;
  is_active: boolean;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCommissionData {
  name: string;
  description: string;
  max_members: number;
}

export interface UpdateCommissionData {
  name?: string;
  description?: string;
  max_members?: number;
  is_active?: boolean;
}

export interface CommissionMember {
  id: number;
  commission_id: number;
  user_id: number;
  joined_at: Date;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface CommissionWithMembers extends Commission {
  members: CommissionMember[];
} 