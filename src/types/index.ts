export enum UserRole {
    ADMIN = 'Admin',
    EXECUTIVE = 'Executive',
    MIDDLE = 'Middle Management',
    STAFF = 'Staff',
}

export interface User {
    id: string;
    employeeCode: string;
    title: string;
    firstName: string;
    lastName: string;
    name: string;
    email: string;
    role: UserRole;
    pointsBalance: number;
    quotaRemaining: number;
    position: string;
    businessUnit: string;
    department: string;
    branch: string;
    avatar: string;
}

export interface Reward {
    id: string;
    name: string;
    costPoints: number;
    stock: number;
    imageUrl: string;
    description: string;
    minPoint?: number;
    levelTitle?: string;
}

export interface RewardLevel extends Reward {
    minPoint: number;
    title: string;
}

export enum TransactionType {
    GIVE = 'GIVE',
    REDEEM = 'REDEEM',
    ADJUSTMENT = 'ADJUSTMENT'
}

export interface Transaction {
    id: string;
    type: TransactionType;
    fromUserId?: string;
    toUserId: string;
    amount: number;
    date: string;
    message?: string;
    category?: string;
    categoryId?: string;
    rewardId?: string;
    source: 'manual' | 'qr' | 'group';
    groupId?: string;
    shippingStatus?: 'pending' | 'approved' | 'preparing' | 'shipped' | 'delivered';
    trackingNumber?: string;
}

export interface GroupTransaction {
    id: string;
    giverId: string;
    groupType: string;
    groupId: string;
    totalPoints: number;
    allocations: { recipientId: string; points: number }[];
    category: string;
    createdAt: string;
}

export interface QuotaSetting {
    role: UserRole;
    monthlyQuota: number;
}

export interface KPIReport {
    totalPointsDistributed: number;
    totalRedemptions: number;
    activeUsers: number;
    topGiver: User | null;
    topReceiver: User | null;
}

export interface QRToken {
    token: string;
    userId: string;
    nonce: string;
    createdAt: number;
    expiresAt: number;
    used: boolean;
}

export type NewsStatus = 'Published' | 'Draft' | 'Archived';

export interface NewsItem {
    id: string;
    title: string;
    summary: string;
    content: string;
    imageUrl?: string;
    status: NewsStatus;
    publishDate?: string;
}
