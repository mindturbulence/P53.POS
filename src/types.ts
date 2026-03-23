import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'staff';
  createdAt: Timestamp;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
  imageUrl?: string;
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
  createdBy: string;
  createdAt: Timestamp;
}
