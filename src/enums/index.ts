// src/enums/index.ts
export enum SubscriptionStatus {
  TRIALING = "TRIALING",
  ACTIVE = "ACTIVE",
  PAST_DUE = "PAST_DUE",
  CANCELED = "CANCELED",
  UNPAID = "UNPAID",
}

export enum SubscriptionPlan {
  FREE = "FREE",
  BASIC = "BASIC",
  PREMIUM = "PREMIUM",
}

export enum PaymentMethod {
  CASH = "CASH",
  CARD = "CARD",
  MOBILE_MONEY = "MOBILE_MONEY",
  BANK_TRANSFER = "BANK_TRANSFER",
}

export enum ProductStatus {
  ACTIVE = "ACTIVE",
  LOW_STOCK = "LOW_STOCK",
  OUT_OF_STOCK = "OUT_OF_STOCK",
  DISCONTINUED = "DISCONTINUED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  PARTIAL = "PARTIAL",
  CANCELLED = "CANCELLED",
}

export enum EmbeddingStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}
