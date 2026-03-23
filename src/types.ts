import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'staff';
  tenantId: string;
  createdAt: Timestamp;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
  imageUrl?: string;
  tenantId: string;
  createdBy: string;
  updatedAt: Timestamp;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface TransactionItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  items: TransactionItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'qris';
  status: 'completed' | 'pending' | 'cancelled';
  tenantId: string;
  createdBy: string;
  createdAt: Timestamp;
}
