import { Router } from "express";
import shopRoutes from "./shop.routes";
import categoryRoutes from "./category.routes";
import supplierRoutes from "./supplier.routes";
import productRoutes from "./product.routes";
import purchaseRoutes from "./purchase.routes";
import saleRoutes from "./sale.routes";

const router = Router();

router.use("/shops", shopRoutes);
router.use("/categories", categoryRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/products", productRoutes);
router.use("/purchases", purchaseRoutes);
router.use("/sales", saleRoutes);

export default router;
