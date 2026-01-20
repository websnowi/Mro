import React from 'react';

export interface Campaign {
  id: string;
  keyword: string;
  link: string;
  clicks: number;
  status: 'Active' | 'Paused' | 'Deleted';
  trend: number; // For visualization
  createdAt: number; // Timestamp
  continuous: boolean;
}

export interface Account {
  id: string;
  username: string;
  password: string;
  createdAt: number;
}

export type Permission = 'manage_campaigns' | 'delete_campaigns' | 'manage_accounts' | 'view_accounts' | 'manage_users';

export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  permissions: Permission[];
  createdAt: number;
}

export interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}