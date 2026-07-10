"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = exports.EmbeddingStatus = exports.PaymentStatus = exports.ProductStatus = exports.PaymentMethod = exports.SubscriptionPlan = exports.SubscriptionStatus = void 0;
// src/enums/index.ts
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["TRIALING"] = "TRIALING";
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["PAST_DUE"] = "PAST_DUE";
    SubscriptionStatus["CANCELED"] = "CANCELED";
    SubscriptionStatus["UNPAID"] = "UNPAID";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var SubscriptionPlan;
(function (SubscriptionPlan) {
    SubscriptionPlan["FREE"] = "FREE";
    SubscriptionPlan["BASIC"] = "BASIC";
    SubscriptionPlan["PREMIUM"] = "PREMIUM";
})(SubscriptionPlan || (exports.SubscriptionPlan = SubscriptionPlan = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["CARD"] = "CARD";
    PaymentMethod["MOBILE_MONEY"] = "MOBILE_MONEY";
    PaymentMethod["BANK_TRANSFER"] = "BANK_TRANSFER";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["ACTIVE"] = "ACTIVE";
    ProductStatus["LOW_STOCK"] = "LOW_STOCK";
    ProductStatus["OUT_OF_STOCK"] = "OUT_OF_STOCK";
    ProductStatus["DISCONTINUED"] = "DISCONTINUED";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PAID"] = "PAID";
    PaymentStatus["PARTIAL"] = "PARTIAL";
    PaymentStatus["CANCELLED"] = "CANCELLED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var EmbeddingStatus;
(function (EmbeddingStatus) {
    EmbeddingStatus["PENDING"] = "PENDING";
    EmbeddingStatus["PROCESSING"] = "PROCESSING";
    EmbeddingStatus["COMPLETED"] = "COMPLETED";
    EmbeddingStatus["FAILED"] = "FAILED";
})(EmbeddingStatus || (exports.EmbeddingStatus = EmbeddingStatus = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["LOW_STOCK"] = "LOW_STOCK";
    NotificationType["OUT_OF_STOCK"] = "OUT_OF_STOCK";
    NotificationType["PRODUCT_EXPIRING"] = "PRODUCT_EXPIRING";
    NotificationType["MONTHLY_SALES_SUMMARY"] = "MONTHLY_SALES_SUMMARY";
    NotificationType["MONTHLY_PROFIT_SUMMARY"] = "MONTHLY_PROFIT_SUMMARY";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
//# sourceMappingURL=index.js.map