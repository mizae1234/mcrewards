export enum RewardStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

export enum RedemptionStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    CANCELLED = 'cancelled',
}

export enum ShippingType {
    PICKUP = 'pickup',
    DELIVERY = 'delivery',
    DIGITAL = 'digital',
}

export enum ShippingStatus {
    NOT_REQUIRED = 'not_required',
    PENDING = 'pending',
    PROCESSING = 'processing',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    RETURNED = 'returned',
}

export interface RewardItem {
    id: string;
    name: string;
    category: string;
    description: string;
    pointsCost: number;
    stock: number;
    imageUrl: string;
    isPhysical: boolean;
    status: RewardStatus;
    createdAt: string;
    updatedAt: string;
}

export interface TrackingInfo {
    carrier: string;
    trackingNumber: string;
    shippedAt?: string;
    deliveredAt?: string;
}

export interface RedemptionRequest {
    id: string;
    rewardId: string;
    rewardName: string;
    employeeCode: string;
    employeeName: string;
    businessUnit: string;
    department: string;
    branch: string;
    pointsUsed: number;
    requestedAt: string;
    status: RedemptionStatus;
    shippingType: ShippingType;
    shippingAddress?: string;
    contactPhone?: string;
    shippingStatus: ShippingStatus;
    tracking?: TrackingInfo;
    note?: string;
    transactionId?: string;
}

export enum HistoryAction {
    REDEEMED = 'redeemed',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
    RETURNED = 'returned',
    UPDATED = 'updated',
}

export interface RewardHistoryEntry {
    id: string;
    rewardId: string;
    rewardName: string;
    employeeCode: string;
    employeeName: string;
    action: HistoryAction;
    timestamp: string;
    actor: string;
    note?: string;
}
