import { Team, TeamMemberWithUser, User } from '../../types';

export interface TeamFormData {
  name: string;
  description: string;
  memberIds: string[];
}

export type TeamViewMode = 'list' | 'detail' | 'create' | 'edit';
