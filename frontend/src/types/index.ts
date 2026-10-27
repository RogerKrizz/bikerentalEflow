/**
 * Shared TypeScript types mirroring backend DTOs.
 */

export interface ApiError {
  code: string;
  message: string;
  timestamp: string;
}

export interface ValidationError extends ApiError {
  errors: Record<string, string>;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// Enums matching backend
export type Role = 'STUDENT' | 'ADMIN';
export type BikeStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
export type LockState = 'LOCKED' | 'UNLOCKED' | 'UNKNOWN';
export type RideState =
  | 'PENDING_UNLOCK'
  | 'ACTIVE'
  | 'TEMPORARILY_LOCKED'
  | 'PENDING_RETURN'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
