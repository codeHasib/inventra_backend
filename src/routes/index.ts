import { Router } from "express";
import shopRoutes from "./shop.routes";
import categoryRoutes from "./category.routes";
import supplierRoutes from "./supplier.routes";
import productRoutes from "./product.routes";
import purchaseRoutes from "./purchase.routes";
import saleRoutes from "./sale.routes";
import dashboardRoutes from "./dashboard.routes";
import aiKnowledgeRoutes from "./ai-knowledge.routes";
import reportRoutes from "./report.routes";
import notificationRoutes from "./notification.routes";
import barcodeRoutes from "./barcode.routes";
import importExportRoutes from "./import-export.routes";
import expenseRoutes from "./expense.routes";
import settingsRoutes from "./settings.routes";

const router = Router();

router.use("/shops", shopRoutes);
router.use("/categories", categoryRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/products", productRoutes);
router.use("/purchases", purchaseRoutes);
router.use("/sales", saleRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/ai/knowledge", aiKnowledgeRoutes);
router.use("/reports", reportRoutes);
router.use("/notifications", notificationRoutes);
router.use("/barcodes", barcodeRoutes);
router.use("/import-export", importExportRoutes);
router.use("/expenses", expenseRoutes);
router.use("/settings", settingsRoutes);

export default router;
