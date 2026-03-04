export interface UserStatus {
  id: number;
  name: string;
  description?: string;
}

export interface UserType {
  id: number;
  name: string;
  description?: string;
}

export interface EmployerStatus {
  id: number;
  name: string;
  description?: string;
}

export interface UserProfile {
  userid: number;
  address?: string;
  zip_code?: string;
  state?: string;
  additional_info?: string;
}

export interface UserSession {
  id: number;
  user_id: number;
  token: string;
  ip_address?: string;
  user_agent?: string;
  last_activity: Date;
  expires_at?: Date;
}

export interface User {
  ID: number;
  user_login: string;
  nickname?: string;
  name: string;
  lastname: string;
  user_nicename?: string;
  user_email: string;
  user_status: number;
  display_name: string;
  user_type: number;
  employer_status_id?: number;
  company?: string;
  company_address?: string;
  country?: string;
  country_json?: string;
  city?: string;
  web?: string;
  facebook?: string;
  phone_number?: string;
  mobile_number?: string;
  notification: boolean;
  payment_setting?: string;
  userid_seller?: number;
  company_role?: string;
  company_contact_name?: string;
  sales_funnel_status?: number;
  user_registered?: Date;
  last_connection?: Date;
  
  profile?: UserProfile;
  userstatus?: UserStatus;
  usertype?: UserType;
  employer_status?: EmployerStatus;
  session?: UserSession;
  roles?: UserRole[];
  seller_representative?: User;
  
  hasInvoicePermission?: boolean;
  isLogisticManager?: boolean;
  isInventoryManager?: boolean;
  isStockManager?: boolean;
}

export interface UserRole {
  id: number;
  userid: number;
  role_assigner?: number;
  id_role: number;
  status: number;
  date_expire?: Date;
  role?: Role;
}

export interface Role {
  id: number;
  name: string;
  module: string;
  status: boolean;
  description?: string;
}

export interface Permission {
  id: number;
  name: string;
  code: string;
  module: string;
  description?: string;
  status: boolean;
}

export interface RolePermission {
  id: number;
  role_id: number;
  permission_id: number;
  status: boolean;
}
