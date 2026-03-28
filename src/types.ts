export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  coupleId?: string;
  role?: 'partner1' | 'partner2';
}

export interface Couple {
  id: string;
  partner1Id: string;
  partner2Id?: string;
  inviteCode: string;
  createdAt: any;
}

export interface Goal {
  id: string;
  coupleId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  createdAt: any;
}

export interface Transaction {
  id: string;
  coupleId: string;
  userId: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  bank?: string;
  date: any;
}

export interface Notification {
  id: string;
  coupleId: string;
  userId: string;
  message: string;
  type: 'transaction' | 'goal' | 'level';
  read: boolean;
  createdAt: string;
}

export type Category = 'Salário' | 'Renda Extra' | 'Aluguel' | 'Contas' | 'Lazer' | 'Comida' | 'Investimentos' | 'Outros';
