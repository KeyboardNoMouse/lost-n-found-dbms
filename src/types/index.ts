// ── Shared types used across pages and API responses ──

export interface Item {
  _id: string;
  title: string;
  description: string;
  type: 'lost' | 'found';
  category: string;
  location: string;
  date: string;
  imageUrl?: string;
  reporterName: string;
  reporterEmail?: string;   // only present for owner / admin views
  reporterPhone?: string;   // only present for owner / admin views
  status: 'open' | 'resolved' | 'expired';
  createdAt?: string;
  deletedAt?: string | null;
}

export interface Claim {
  _id: string;
  itemId: string;
  claimerEmail: string;
  claimerName: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: { field: string; message: string }[];
  pagination?: Pagination;
}
