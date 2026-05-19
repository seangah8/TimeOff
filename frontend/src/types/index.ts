export type UserRole = 'Requester' | 'Validator';
export type VacationStatus = 'Pending' | 'Approved' | 'Rejected';

export interface User {
  id: number;
  name: string;
  role: UserRole;
}

export interface VacationRequest {
  id: number;
  requester: User;
  validator: User | null;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: VacationStatus;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: string;
  details?: { field: string; message: string }[];
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
