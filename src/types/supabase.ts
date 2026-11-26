import type {
  RedeemInviteResult,
  SquadFeedMember,
  SquadInviteSummary,
  SquadMember,
  SquadSummary,
  UserProfile,
} from './domain';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          auto_detection_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          auto_detection_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      ensure_my_profile: {
        Args: Record<string, never>;
        Returns: UserProfile[];
      };
      update_my_profile: {
        Args: {
          p_display_name: string;
        };
        Returns: UserProfile[];
      };
      create_squad: {
        Args: {
          p_name: string;
        };
        Returns: string;
      };
      create_invite: {
        Args: {
          p_squad_id: string;
          p_ttl_hours?: number;
        };
        Returns: string;
      };
      redeem_invite: {
        Args: {
          p_raw_token: string;
        };
        Returns: RedeemInviteResult[];
      };
      get_my_squads: {
        Args: Record<string, never>;
        Returns: SquadSummary[];
      };
      get_squad_members: {
        Args: {
          p_squad_id: string;
        };
        Returns: SquadMember[];
      };
      get_squad_feed: {
        Args: {
          p_squad_id: string;
        };
        Returns: SquadFeedMember[];
      };
      list_squad_invites: {
        Args: {
          p_squad_id: string;
        };
        Returns: SquadInviteSummary[];
      };
      revoke_invite: {
        Args: {
          p_invite_id: string;
        };
        Returns: null;
      };
      remove_member: {
        Args: {
          p_squad_id: string;
          p_target_user_id: string;
        };
        Returns: null;
      };
      leave_squad: {
        Args: {
          p_squad_id: string;
        };
        Returns: null;
      };
      transfer_ownership: {
        Args: {
          p_squad_id: string;
          p_new_owner_user_id: string;
        };
        Returns: null;
      };
      delete_squad: {
        Args: {
          p_squad_id: string;
        };
        Returns: null;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
