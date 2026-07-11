# Inventra AI Backend - Complete Technical Overview

---

## 1. Project Overview

### Tech Stack

| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | - |
| Language | TypeScript | ^5.9.2 |
| Framework | Express | ^5.2.1 |
| Database | MongoDB (Mongoose) | ^9.7.4 |
| Authentication | Better Auth (external service) | - |
| AI | Google Gemini | ^2.11.0 |
| File Storage | Cloudinary | ^2.10.0 |
| Validation | Zod | ^4.4.3 |
| PDF Generation | pdfkit | ^0.19.1 |
| Excel Generation | exceljs | ^4.4.0 |
| Barcode/QR | qrcode | ^1.5.4 (custom Code128 implementation) |
| Doc Parsing | mammoth (docx), pdf-parse (pdf) | - |

### Architecture

- **Pattern**: MVC (Model-View-Controller) with Service layer
- **Structure**: `server.ts` -> `app.ts` -> `routes` -> `controllers` -> `services` -> `models`
- **Multi-tenancy**: Shop-based isolation (every query scoped by `shopId`)
- **Soft Deletes**: All entities use `isDeleted: boolean` flag, never physically deleted
- **Authentication**: Delegated to external Better Auth service (separate frontend app at `BETTER_AUTH_URL`). Backend verifies sessions via HTTP cookie forwarding.

### Folder Structure

```
src/
  server.ts              # Entry point - starts server, connects DB
  app.ts                 # Express app setup, middleware, routes
  config/
    db.ts                # MongoDB connection
    cloudinary.ts        # Cloudinary SDK setup
    better-auth.ts       # Better Auth session verification
  constants/
    index.ts             # HTTP_STATUS codes
  controllers/           # 14 controller files (request/response handling)
  enums/
    index.ts             # All enums (PaymentStatus, ProductStatus, etc.)
  interfaces/            # Empty directory
  middlewares/
    auth.middleware.ts    # requireAuth, requireOwner, requireStaff, requireShopAccess
    error.middleware.ts   # Global error handler
    validate.middleware.ts # Zod validation middleware
  models/                # 10 Mongoose models
  routes/                # 15 route files + index.ts
  services/              # 14 service files (business logic)
  types/
    express.d.ts         # Global Express Request augmentation
    mammoth.d.ts         # Mammoth module declaration
  utils/
    AppError.ts          # Custom error class
    asyncHandler.ts      # Async error wrapper
    logger.ts            # Console logger with timestamps
    response.ts          # Standardized sendResponse helper
  validators/            # 7 Zod schema files
```

### Main Entry Point

`src/server.ts` - Loads dotenv, calls `connectDatabase()`, starts Express on `PORT` (default 5000), registers graceful shutdown handlers for SIGTERM/SIGINT, uncaughtException, unhandledRejection.

### Request Flow

```
Client Request
  -> helmet() (security headers)
  -> cors() (CORS with credentials)
  -> compression() (gzip)
  -> express.json() (body parsing)
  -> cookieParser()
  -> morgan("dev") (logging)
  -> rateLimiter (100 req/15min on /api)
  -> /health (GET only, no auth)
  -> /api routes
       -> requireAuth middleware (verifies cookie with Better Auth service)
       -> requireShopAccess middleware (verifies shop exists and user has shopId)
       -> validateRequest middleware (Zod schema validation)
       -> Controller handler
            -> Service function
                 -> Mongoose Model
            -> sendResponse(res, statusCode, message, data)
  -> 404 handler (unmatched routes)
  -> errorHandler (global error middleware)
```

---

## 2. Environment Variables

| Variable | Required | Default | Where Used |
|---|---|---|---|
| `PORT` | Optional | `5000` | `src/server.ts` - Server listen port |
| `NODE_ENV` | Optional | `development` | `src/app.ts` (error stack exposure), `src/utils/logger.ts` (debug logging) |
| `MONGODB_URI` | **Required** | - | `src/config/db.ts` - MongoDB connection string |
| `JWT_SECRET` | Optional | - | Listed in .env but **NOT used anywhere in code** (Better Auth handles JWT externally) |
| `JWT_EXPIRES_IN` | Optional | - | Listed in .env but **NOT used anywhere in code** |
| `CLOUDINARY_CLOUD_NAME` | **Required** | - | `src/config/cloudinary.ts` - Cloudinary config |
| `CLOUDINARY_API_KEY` | **Required** | - | `src/config/cloudinary.ts` - Cloudinary config |
| `CLOUDINARY_API_SECRET` | **Required** | - | `src/config/cloudinary.ts` - Cloudinary config |
| `GEMINI_API_KEY` | **Required** | - | `src/services/ai-knowledge.service.ts` - Google Gemini API |
| `BETTER_AUTH_URL` | **Required** | `http://localhost:3000` | `src/config/better-auth.ts`, `src/app.ts` (CORS origin) - Frontend/auth service URL |

---

## 3. Database

Database: **MongoDB** via Mongoose ODM. Connection string: `MONGODB_URI`.

### 3.1 Shop

**Purpose**: Multi-tenant entity. Every other data model belongs to a shop.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `ownerId` | String | Yes | - | The Better Auth user ID of the owner |
| `name` | String | Yes | - | Max 200 chars, trimmed |
| `slug` | String | Yes | - | Unique per owner, lowercase, regex: `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| `businessType` | String | Yes | - | Free text (e.g., "Retail", "Grocery") |
| `phone` | String | Yes | - | |
| `email` | String | Yes | - | Lowercase |
| `logo` | String | No | `""` | Cloudinary URL |
| `currency` | String | No | `"USD"` | Uppercase, 3 chars |
| `timezone` | String | No | `"UTC"` | |
| `address` | String | Yes | - | |
| `subscriptionPlan` | Enum(SubscriptionPlan) | No | `FREE` | `FREE`, `BASIC`, `PREMIUM` |
| `subscriptionStatus` | Enum(SubscriptionStatus) | No | `TRIALING` | `TRIALING`, `ACTIVE`, `PAST_DUE`, `CANCELED`, `UNPAID` |
| `isActive` | Boolean | No | `true` | |
| `isDeleted` | Boolean | No | `false` | Soft delete flag |

**Indexes**: `{ownerId, isDeleted}`, `{ownerId, slug}` (unique compound)

---

### 3.2 Category

**Purpose**: Product categories within a shop.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `shopId` | ObjectId -> Shop | Yes | - | |
| `name` | String | Yes | - | Max 100 chars, trimmed |
| `description` | String | No | `""` | |
| `color` | String | No | `"#000000"` | Hex color code |
| `icon` | String | No | `"default-icon"` | |
| `isActive` | Boolean | No | `true` | |
| `isDeleted` | Boolean | No | `false` | |

**Indexes**: `{shopId, isDeleted}`, `{shopId, name}`

---

### 3.3 Supplier

**Purpose**: Product suppliers/vendors.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `shopId` | ObjectId -> Shop | Yes | - | |
| `name` | String | Yes | - | Max 200 chars |
| `company` | String | No | `""` | |
| `phone` | String | Yes | - | |
| `email` | String | No | `""` | Lowercase |
| `address` | String | No | `""` | |
| `tradeLicense` | String | No | `""` | |
| `notes` | String | No | `""` | |
| `isActive` | Boolean | No | `true` | |
| `isDeleted` | Boolean | No | `false` | |

**Indexes**: `{shopId, isDeleted}`, `{shopId, name}` (unique compound)

---

### 3.4 Product

**Purpose**: Core inventory entity. Belongs to a shop, category, and supplier.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `shopId` | ObjectId -> Shop | Yes | - | |
| `categoryId` | ObjectId -> Category | Yes | - | |
| `supplierId` | ObjectId -> Supplier | Yes | - | |
| `name` | String | Yes | - | Max 200 chars |
| `description` | String | No | `""` | |
| `sku` | String | Yes | Auto-generated | Uppercase. Format: `PREFIX-TIMESTAMP-RANDOM` |
| `barcode` | String | No | `""` | Unique per shop (sparse index) |
| `brand` | String | No | `""` | |
| `purchasePrice` | Number | Yes | - | Min 0 |
| `sellingPrice` | Number | Yes | - | Min 0 |
| `profitMargin` | Number | No | `0` | Auto-calculated: `((selling - purchase) / purchase) * 100` |
| `currentStock` | Number | No | `0` | Min 0 |
| `minimumStock` | Number | No | `5` | |
| `maximumStock` | Number | No | `1000` | |
| `reorderLevel` | Number | No | `10` | |
| `unit` | String | Yes | - | e.g., "pcs", "kg", "box" |
| `images` | [String] | No | `[]` | Array of Cloudinary URLs |
| `expiryDate` | Date | No | `null` | |
| `manufactureDate` | Date | No | `null` | |
| `status` | Enum(ProductStatus) | No | `ACTIVE` | `ACTIVE`, `LOW_STOCK`, `OUT_OF_STOCK`, `DISCONTINUED` - Auto-determined |
| `isActive` | Boolean | No | `true` | |
| `isDeleted` | Boolean | No | `false` | |

**Status Logic**:
- `currentStock <= 0` -> `OUT_OF_STOCK`
- `currentStock <= reorderLevel` -> `LOW_STOCK`
- Otherwise -> `ACTIVE`

**Indexes**: `{shopId, isDeleted}`, `{shopId, name, sku}` (unique), `{shopId, barcode}` (unique sparse), `{shopId, status}`, `{shopId, categoryId}`, `{shopId, supplierId}`

---

### 3.5 Purchase

**Purpose**: Records stock purchase transactions from suppliers. Automatically increases product stock.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `shopId` | ObjectId -> Shop | Yes | - | Indexed |
| `supplierId` | ObjectId -> Supplier | Yes | - | |
| `invoiceNumber` | String | Yes | Auto-generated | Unique. Format: `PUR-TIMESTAMP-RANDOM` |
| `purchaseDate` | Date | No | `Date.now` | Indexed |
| `items` | [PurchaseItem] | Yes | - | Array, min 1 item (validated) |
| `items[].productId` | ObjectId -> Product | Yes | - | |
| `items[].quantity` | Number | Yes | - | Min 1 |
| `items[].purchasePrice` | Number | Yes | - | Min 0 |
| `items[].totalPrice` | Number | Yes | - | Calculated: `quantity * purchasePrice` |
| `subtotal` | Number | Yes | - | Sum of all items |
| `discount` | Number | No | `0` | Min 0 |
| `tax` | Number | No | `0` | Min 0 |
| `total` | Number | Yes | - | `subtotal - discount + tax` |
| `paymentStatus` | Enum(PaymentStatus) | No | `PENDING` | `PENDING`, `PAID`, `PARTIAL`, `CANCELLED`, `REFUNDED` |
| `paymentMethod` | Enum(PaymentMethod) | Yes | - | `CASH`, `CARD`, `MOBILE_MONEY`, `BANK_TRANSFER` |
| `notes` | String | No | `""` | |
| `isDeleted` | Boolean | No | `false` | |

**Side Effects**: Creating a purchase increases `currentStock` for each product. Deleting a purchase decreases stock. Updating items reverses old stock changes and applies new ones.

**Indexes**: `{shopId, isDeleted}`, `{shopId, supplierId}`, `{shopId, purchaseDate: -1}`, `{shopId, paymentStatus}`, `invoiceNumber` (unique)

---

### 3.6 Sale

**Purpose**: Records sale transactions. Decreases product stock. Contains denormalized product data for historical accuracy.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `shopId` | ObjectId -> Shop | Yes | - | |
| `invoiceNumber` | String | Yes | Auto-generated | Unique. Format: `INV-TIMESTAMP-RANDOM` |
| `items` | [SaleItem] | Yes | - | Embedded subdocuments |
| `items[].productId` | ObjectId -> Product | Yes | - | |
| `items[].productName` | String | Yes | - | Denormalized |
| `items[].sku` | String | Yes | - | Denormalized, uppercase |
| `items[].barcode` | String | No | `""` | Denormalized |
| `items[].quantity` | Number | Yes | - | Min 1 |
| `items[].purchasePrice` | Number | Yes | - | Cost price at time of sale |
| `items[].sellingPrice` | Number | Yes | - | Sale price |
| `items[].profitPerUnit` | Number | Yes | - | `sellingPrice - purchasePrice` |
| `items[].total` | Number | Yes | - | `quantity * sellingPrice` |
| `subtotal` | Number | Yes | - | |
| `discount` | Number | No | `0` | |
| `tax` | Number | No | `0` | |
| `grandTotal` | Number | Yes | - | `subtotal - discount + tax` |
| `paymentMethod` | Enum(PaymentMethod) | Yes | - | |
| `paymentStatus` | Enum(PaymentStatus) | No | `PAID` | Default is `PAID` (unlike Purchase) |
| `customerName` | String | No | `"Walk-in Customer"` | |
| `customerPhone` | String | No | `""` | |
| `notes` | String | No | `""` | |
| `saleDate` | Date | No | `Date.now` | |
| `isDeleted` | Boolean | No | `false` | |

**Side Effects**: Creating a sale decreases stock (with validation for insufficient stock). Deleting/restoring a sale increases stock. Refunding sets `paymentStatus` to `REFUNDED` and increases stock.

**Indexes**: `{shopId, saleDate: -1}`, `{shopId, invoiceNumber}` (unique), `{shopId, paymentStatus}`, `{shopId, paymentMethod}`, `{shopId, isDeleted}`

---

### 3.7 Expense

**Purpose**: Tracks business operating expenses (rent, utilities, salaries, etc.).

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `shopId` | ObjectId -> Shop | Yes | - | |
| `title` | String | Yes | - | Max 200 chars |
| `amount` | Number | Yes | - | Min 0.01 |
| `category` | String | Yes | - | Free text (e.g., "Rent", "Utilities") - NOT linked to Product Category |
| `paymentMethod` | Enum(PaymentMethod) | Yes | - | |
| `expenseDate` | Date | No | `Date.now` | |
| `vendor` | String | No | `""` | Max 200 chars |
| `notes` | String | No | `""` | Max 500 chars |
| `receiptImage` | String | No | `""` | Cloudinary URL |
| `isDeleted` | Boolean | No | `false` | |

**Indexes**: `{shopId, isDeleted}`, `{shopId, category}`, `{shopId, expenseDate: -1}`, `{shopId, createdAt: -1}`

---

### 3.8 Knowledge Document / Knowledge Chunk / Chat History (AI Knowledge)

**Purpose**: RAG (Retrieval-Augmented Generation) system for AI chat over uploaded business documents.

#### KnowledgeDocument

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `shopId` | ObjectId -> Shop | Yes | - | |
| `fileName` | String | Yes | - | Original filename |
| `fileType` | String | Yes | - | Enum: `pdf`, `docx`, `txt`, `csv` |
| `cloudinaryUrl` | String | Yes | - | |
| `cloudinaryPublicId` | String | Yes | - | |
| `extractedText` | String | No | `""` | Full extracted text |
| `wordCount` | Number | No | `0` | |
| `status` | Enum(EmbeddingStatus) | No | `PENDING` | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` |
| `analysis` | Object | No | `{}` | `{ summary, businessInsights, keywords[], recommendedActions[] }` |
| `isActive` | Boolean | No | `true` | |
| `isDeleted` | Boolean | No | `false` | |

#### KnowledgeChunk

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `shopId` | ObjectId -> Shop | Yes | - | |
| `documentId` | ObjectId -> KnowledgeDocument | Yes | - | |
| `content` | String | Yes | - | Chunk text (~650 words each) |
| `chunkIndex` | Number | Yes | - | Order within document |
| `wordCount` | Number | Yes | - | |
| `isActive` | Boolean | No | `true` | |

#### ChatHistory

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `shopId` | ObjectId -> Shop | Yes | - | |
| `question` | String | Yes | - | |
| `answer` | String | Yes | - | |
| `sources` | Array | No | `[]` | `[{ documentId, fileName, chunkIndex }]` |

---

### 3.9 Notification

**Purpose**: In-app notifications for inventory alerts, monthly summaries, etc.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `shopId` | ObjectId -> Shop | Yes | - | |
| `type` | Enum(NotificationType) | Yes | - | `LOW_STOCK`, `OUT_OF_STOCK`, `PRODUCT_EXPIRING`, `MONTHLY_SALES_SUMMARY`, `MONTHLY_PROFIT_SUMMARY` |
| `title` | String | Yes | - | Max 200 chars |
| `message` | String | Yes | - | Max 500 chars |
| `productId` | ObjectId -> Product | No | `null` | |
| `metadata` | Mixed | No | `null` | Arbitrary JSON data |
| `isRead` | Boolean | No | `false` | |
| `isDeleted` | Boolean | No | `false` | |

**Indexes**: `{shopId, isDeleted, isRead}`, `{shopId, type}`, `{shopId, createdAt: -1}`

---

### 3.10 Settings

**Purpose**: Per-shop configuration/business profile. 1:1 relationship with Shop (unique on `shopId`).

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `shopId` | ObjectId -> Shop | Yes | - | Unique |
| `businessName` | String | No | `""` | Max 200 chars |
| `logo` | String | No | `""` | |
| `phone` | String | No | `""` | |
| `email` | String | No | `""` | |
| `address` | String | No | `""` | |
| `currency` | String | No | `"USD"` | Uppercase, max 3 |
| `timezone` | String | No | `"UTC"` | |
| `taxPercentage` | Number | No | `0` | 0-100 |
| `invoicePrefix` | String | No | `"INV-"` | Max 10 chars |
| `lowStockThreshold` | Number | No | `10` | |
| `businessType` | String | No | `""` | |

**Note**: When settings are updated, key fields (`businessName`, `logo`, `phone`, `email`, `address`, `currency`, `timezone`, `businessType`) are synced back to the `Shop` model.

---

## 4. Authentication

### How It Works

Authentication is **delegated to an external service** (the frontend app running at `BETTER_AUTH_URL`, typically `http://localhost:3000`). The backend does NOT issue JWT tokens or manage sessions directly.

**Flow**:
1. User logs in via the frontend app (Better Auth handles user creation, login, sessions).
2. The frontend stores the session cookie.
3. All API requests from the frontend include the cookie.
4. The backend middleware extracts the `Cookie` header and forwards it to `BETTER_AUTH_URL/api/auth/get-session`.
5. Better Auth validates the session and returns `{ user, session }`.
6. The backend extracts `id`, `email`, `role`, `shopId` from the user object and attaches to `req.user`.

### Middleware Stack (Execution Order)

```
1. requireAuth       - Verifies session cookie with Better Auth service. Sets req.user.
2. requireOwner      - Checks req.user.role === "owner"
3. requireStaff      - Checks req.user.role is "owner" or "staff"
4. requireShopAccess - Checks req.user.shopId exists, and Shop document exists & is active
5. validateRequest   - Validates req.body/params/query against Zod schema
```

### `req.user` Structure (Global Type Augmentation)

```typescript
interface Request {
  user?: {
    id: string;       // Better Auth user ID
    email: string;    // User email
    role: string;     // "owner" | "staff"
    shopId: string | null;  // Associated shop ID (null if no shop)
  };
}
```

### Protected Routes

| Route Group | Middleware | Auth Level |
|---|---|---|
| `/api/shops` | `requireAuth` + `requireOwner` (for create/update/delete) | Owner |
| `/api/categories` | `requireAuth` + `requireShopAccess` | Authenticated + Has shop |
| `/api/suppliers` | `requireAuth` + `requireShopAccess` | Authenticated + Has shop |
| `/api/products` | `requireAuth` + `requireShopAccess` | Authenticated + Has shop |
| `/api/purchases` | `requireAuth` + `requireShopAccess` | Authenticated + Has shop |
| `/api/sales` | `requireAuth` + `requireShopAccess` | Authenticated + Has shop |
| `/api/expenses` | `requireAuth` + `requireShopAccess` | Authenticated + Has shop |
| `/api/dashboard` | `requireAuth` + `requireShopAccess` | Authenticated + Has shop |
| `/api/settings` | `requireAuth` + `requireShopAccess` | Authenticated + Has shop |
| `/api/ai/knowledge` | `requireAuth` + `requireShopAccess` | Authenticated + Has shop |
| `/api/barcodes` | `requireAuth` + `requireShopAccess` | Authenticated + Has shop |
| `/api/import-export` | `requireAuth` + `requireShopAccess` | Authenticated + Has shop |
| `/api/notifications` | `requireAuth` + `requireShopAccess` | Authenticated + Has shop |
| `/api/reports` | `requireAuth` + `requireShopAccess` | Authenticated + Has shop |

### Roles

| Role | Capabilities |
|---|---|
| `owner` | Full access. Can create/update/delete shops. Full CRUD on all entities. |
| `staff` | Can access shop data (CRUD on categories, suppliers, products, purchases, sales, etc.) but cannot create/delete shops. |

### Multi-Tenant Protection

- Every database query includes `shopId` filter.
- `requireShopAccess` middleware verifies the Shop document exists and `isDeleted: false`.
- Shop operations (get/update/delete) additionally verify `ownerId === req.user.id`.

---

## 5. API Documentation

### Standard Response Format

```json
{
  "success": true | false,
  "message": "Description",
  "data": { ... } | null
}
```

### Error Response Format

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "data": null | { stack trace in development }
}
```

---

### 5.1 Shop

All shop routes require `requireAuth`. Create/Update/Delete additionally require `requireOwner`.

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET` | `/api/shops` | requireAuth | List shops for current owner |
| `GET` | `/api/shops/:id` | requireAuth | Get single shop |
| `POST` | `/api/shops` | requireAuth + requireOwner | Create new shop |
| `PUT` | `/api/shops/:id` | requireAuth + requireOwner | Update shop |
| `DELETE` | `/api/shops/:id` | requireAuth + requireOwner | Soft delete shop |

#### GET /api/shops

**Query Parameters**: `page` (int, default 1), `limit` (int, default 10, max 100), `search` (string)

**Response**:
```json
{
  "success": true,
  "message": "Shops fetched successfully",
  "data": {
    "shops": [IShop],
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

#### GET /api/shops/:id

**Params**: `id` (ObjectId, validated)

**Response**:
```json
{
  "success": true,
  "message": "Shop fetched successfully",
  "data": { IShop }
}
```

#### POST /api/shops

**Body**:
```json
{
  "name": "My Shop",
  "slug": "my-shop",
  "businessType": "Retail",
  "phone": "+1234567890",
  "email": "shop@example.com",
  "address": "123 Main St",
  "logo": "https://...",    // optional
  "currency": "USD",         // optional, default "USD"
  "timezone": "UTC"          // optional, default "UTC"
}
```

**Validation**: `createShopSchema` - name (1-200), slug (regex validated), businessType, phone, email (valid email), address (all required).

#### PUT /api/shops/:id

**Body**: Same as POST but all fields optional.

#### DELETE /api/shops/:id

Soft-deletes the shop (`isDeleted: true`, `isActive: false`).

---

### 5.2 Category

All routes require `requireAuth` + `requireShopAccess`.

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET` | `/api/categories` | Yes | List all categories for shop |
| `GET` | `/api/categories/:id` | Yes | Get single category |
| `POST` | `/api/categories` | Yes | Create category |
| `PUT` | `/api/categories/:id` | Yes | Update category |
| `DELETE` | `/api/categories/:id` | Yes | Soft delete category |

#### GET /api/categories

**Query**: None (returns all non-deleted categories for the shop)

**Response**:
```json
{
  "success": true,
  "message": "Categories fetched successfully",
  "data": [ICategory]
}
```

#### POST /api/categories

**Body**:
```json
{
  "name": "Electronics",          // required, 1-100 chars
  "description": "Electronic items", // optional
  "color": "#FF5733",              // optional, hex color regex
  "icon": "electronics"            // optional, max 50 chars
}
```

**Error**: 400 if category name already exists in the shop.

---

### 5.3 Supplier

All routes require `requireAuth` + `requireShopAccess`.

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET` | `/api/suppliers` | Yes | List suppliers (paginated) |
| `GET` | `/api/suppliers/:id` | Yes | Get single supplier |
| `POST` | `/api/suppliers` | Yes | Create supplier |
| `PATCH` | `/api/suppliers/:id` | Yes | Update supplier |
| `DELETE` | `/api/suppliers/:id` | Yes | Soft delete supplier |

#### GET /api/suppliers

**Query**: `page`, `limit`, `search` (name/company), `isActive` ("true"/"false")

**Response**:
```json
{
  "success": true,
  "message": "Suppliers fetched successfully",
  "data": {
    "suppliers": [ISupplier],
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

#### POST /api/suppliers

**Body**:
```json
{
  "name": "Acme Supplies",    // required, 1-200
  "company": "Acme Corp",     // optional
  "phone": "+1234567890",     // required
  "email": "info@acme.com",   // optional
  "address": "456 Industrial",// optional
  "tradeLicense": "TL-123",   // optional
  "notes": "Primary supplier" // optional
}
```

---

### 5.4 Product

All routes require `requireAuth` + `requireShopAccess`.

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET` | `/api/products` | Yes | List products (paginated, filterable) |
| `GET` | `/api/products/statistics` | Yes | Product statistics |
| `GET` | `/api/products/low-stock` | Yes | List low stock products |
| `GET` | `/api/products/out-of-stock` | Yes | List out of stock products |
| `GET` | `/api/products/:id` | Yes | Get single product |
| `POST` | `/api/products` | Yes | Create product |
| `PATCH` | `/api/products/:id` | Yes | Update product |
| `DELETE` | `/api/products/:id` | Yes | Soft delete product |
| `PATCH` | `/api/products/:id/stock` | Yes | Update stock directly |

#### GET /api/products

**Query Parameters**:
- `page` (int, default 1)
- `limit` (int, default 10, max 100)
- `search` (string - searches name, sku, barcode, brand)
- `categoryId` (ObjectId)
- `supplierId` (ObjectId)
- `status` (enum: ACTIVE, LOW_STOCK, OUT_OF_STOCK, DISCONTINUED)
- `brand` (string, case-insensitive regex)
- `lowStock` ("true"/"false")
- `outOfStock` ("true"/"false")
- `isActive` ("true"/"false")
- `sort` (enum: newest, oldest, name-asc, price-asc, price-desc, stock-asc, stock-desc)

**Response**:
```json
{
  "success": true,
  "message": "Products fetched successfully",
  "data": {
    "products": [
      {
        "_id": "...",
        "name": "Widget",
        "sku": "WGT-ABC123-XYZ",
        "categoryId": { "_id": "...", "name": "Electronics", "color": "#FF5733", "icon": "electronics" },
        "supplierId": { "_id": "...", "name": "Acme", "company": "Acme Corp" },
        "purchasePrice": 10.00,
        "sellingPrice": 25.00,
        "profitMargin": 150,
        "currentStock": 50,
        "status": "ACTIVE",
        ...
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

**Note**: Product list populates `categoryId` (name, color, icon) and `supplierId` (name, company).

#### POST /api/products

**Body**:
```json
{
  "categoryId": "ObjectId",    // required
  "supplierId": "ObjectId",    // required
  "name": "Widget Pro",        // required, 1-200
  "description": "...",        // optional
  "sku": "WP-001",             // optional (auto-generated if omitted)
  "barcode": "123456789",      // optional
  "brand": "Acme",             // optional
  "purchasePrice": 10.00,      // required, >= 0
  "sellingPrice": 25.00,       // required, >= 0
  "currentStock": 100,         // optional, default 0
  "minimumStock": 5,           // optional, default 5
  "maximumStock": 1000,        // optional, default 1000
  "reorderLevel": 10,          // optional, default 10
  "unit": "pcs",               // required
  "images": ["url1", "url2"],  // optional
  "expiryDate": "2026-12-31",  // optional, ISO datetime
  "manufactureDate": "2026-01-01" // optional, ISO datetime
}
```

#### PATCH /api/products/:id/stock

**Body**:
```json
{
  "currentStock": 150  // required, >= 0
}
```

---

### 5.5 Purchase

All routes require `requireAuth` + `requireShopAccess`.

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET` | `/api/purchases` | Yes | List purchases (paginated) |
| `GET` | `/api/purchases/statistics` | Yes | Purchase statistics |
| `GET` | `/api/purchases/:id` | Yes | Get single purchase |
| `POST` | `/api/purchases` | Yes | Create purchase (increases stock) |
| `PATCH` | `/api/purchases/:id` | Yes | Update purchase |
| `DELETE` | `/api/purchases/:id` | Yes | Soft delete purchase (decreases stock) |

#### GET /api/purchases

**Query**: `page`, `limit`, `search` (invoiceNumber, notes), `supplierId`, `paymentStatus`, `startDate`, `endDate`

**Response**:
```json
{
  "success": true,
  "message": "Purchases fetched successfully",
  "data": {
    "purchases": [
      {
        "_id": "...",
        "supplierId": { "name": "Acme", "company": "Acme Corp" },
        "invoiceNumber": "PUR-ABC123-XYZ",
        "purchaseDate": "2026-01-15",
        "items": [{ "productId": { "name": "...", "sku": "..." }, "quantity": 10, "purchasePrice": 10, "totalPrice": 100 }],
        "subtotal": 100,
        "discount": 5,
        "tax": 8,
        "total": 103,
        "paymentStatus": "PAID",
        "paymentMethod": "CASH"
      }
    ],
    "total": 50, "page": 1, "limit": 10, "totalPages": 5
  }
}
```

#### POST /api/purchases

**Body**:
```json
{
  "supplierId": "ObjectId",           // required
  "invoiceNumber": "INV-001",         // optional (auto-generated)
  "purchaseDate": "2026-01-15T00:00:00.000Z", // optional (default: now)
  "items": [                          // required, min 1
    {
      "productId": "ObjectId",        // required
      "quantity": 10,                 // required, >= 1
      "purchasePrice": 10.00          // required, >= 0
    }
  ],
  "discount": 5.00,                   // optional, >= 0
  "tax": 8.00,                        // optional, >= 0
  "paymentStatus": "PAID",            // optional (default: PENDING)
  "paymentMethod": "CASH",            // required
  "notes": "Monthly restock"          // optional
}
```

**Side Effect**: Each item's product `currentStock` is increased by `quantity`. Product status is recalculated.

---

### 5.6 Sale

All routes require `requireAuth` + `requireShopAccess`.

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET` | `/api/sales` | Yes | List sales (paginated) |
| `GET` | `/api/sales/statistics` | Yes | Sales statistics (optional date range) |
| `GET` | `/api/sales/top-products` | Yes | Top selling products |
| `GET` | `/api/sales/:id` | Yes | Get single sale |
| `POST` | `/api/sales` | Yes | Create sale (decreases stock) |
| `PATCH` | `/api/sales/:id` | Yes | Update sale (customer info, payment) |
| `PATCH` | `/api/sales/:id/refund` | Yes | Refund sale (restores stock) |
| `DELETE` | `/api/sales/:id` | Yes | Soft delete sale (restores stock) |

#### GET /api/sales

**Query**: `page`, `limit`, `search` (invoiceNumber, customerName, customerPhone, items.productName), `paymentMethod`, `paymentStatus`, `startDate`, `endDate`

#### POST /api/sales

**Body**:
```json
{
  "items": [                          // required, min 1
    {
      "productId": "ObjectId",        // required
      "quantity": 2,                  // required, >= 1
      "unitPrice": 25.00             // required, >= 0
    }
  ],
  "discount": 5.00,                   // optional
  "tax": 3.50,                        // optional
  "paymentMethod": "CARD",            // required
  "paymentStatus": "PAID",            // optional (default: PAID)
  "customerName": "John Doe",         // optional (default: "Walk-in Customer")
  "customerPhone": "+1234567890",     // optional
  "notes": "Thank you!"               // optional
}
```

**Side Effect**: Stock is decreased. `profitPerUnit` is calculated as `sellingPrice - product.purchasePrice`. Insufficient stock returns 400 error.

#### PATCH /api/sales/:id/refund

Refunds the sale: sets `paymentStatus` to `REFUNDED`, restores product stock. Returns 400 if already refunded.

---

### 5.7 Expense

All routes require `requireAuth` + `requireShopAccess`.

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET` | `/api/expenses/statistics` | Yes | Expense statistics |
| `GET` | `/api/expenses` | Yes | List expenses (paginated) |
| `GET` | `/api/expenses/:id` | Yes | Get single expense |
| `POST` | `/api/expenses` | Yes | Create expense |
| `PATCH` | `/api/expenses/:id` | Yes | Update expense |
| `DELETE` | `/api/expenses/:id` | Yes | Soft delete expense |

#### GET /api/expenses

**Query**: `page`, `limit`, `search` (title, vendor, notes, category), `category`, `paymentMethod`, `startDate`, `endDate`, `sortBy` (amount, expenseDate, createdAt, title), `sortOrder` (asc, desc)

#### GET /api/expenses/statistics

**Query**: `startDate`, `endDate`

**Response**:
```json
{
  "success": true,
  "message": "Expense statistics fetched successfully",
  "data": {
    "totalExpenses": 45,
    "totalAmount": 12500.00,
    "averageExpense": 277.78,
    "categoryBreakdown": [
      { "category": "Rent", "total": 5000, "count": 5 }
    ],
    "paymentMethodBreakdown": [
      { "method": "CASH", "total": 3000, "count": 10 }
    ],
    "monthlyTrend": [
      { "month": "2026-01", "total": 2500 }
    ]
  }
}
```

#### POST /api/expenses

**Body**:
```json
{
  "title": "Office Rent",           // required, 1-200
  "amount": 1500.00,                // required, > 0
  "category": "Rent",               // required, 1-100 (free text)
  "paymentMethod": "BANK_TRANSFER", // required
  "expenseDate": "2026-01-01T00:00:00.000Z", // optional
  "vendor": "Landlord Inc",         // optional
  "notes": "January rent",          // optional
  "receiptImage": "https://..."     // optional
}
```

---

### 5.8 Dashboard

All routes require `requireAuth` + `requireShopAccess`.

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/overview` | Yes | Full overview metrics |
| `GET` | `/api/dashboard/revenue` | Yes | Revenue data + trends |
| `GET` | `/api/dashboard/sales` | Yes | Sales data + trends |
| `GET` | `/api/dashboard/inventory` | Yes | Inventory breakdown |
| `GET` | `/api/dashboard/charts` | Yes | Chart data (7d, 30d, 12m revenue, sales, purchases, expenses) |
| `GET` | `/api/dashboard/top-products` | Yes | Top products, categories, suppliers, profitable, slow/fast moving |
| `GET` | `/api/dashboard/warnings` | Yes | Low stock, out of stock, expiring, inactive alerts |

#### GET /api/dashboard/overview

**Response**:
```json
{
  "success": true,
  "message": "Dashboard overview fetched successfully",
  "data": {
    "inventory": {
      "totalProducts": 150,
      "activeProducts": 120,
      "lowStockProducts": 15,
      "outOfStockProducts": 10,
      "inventoryValue": 45000.00,
      "inventoryCost": 30000.00,
      "inventoryPotentialRevenue": 45000.00
    },
    "sales": {
      "todaySales": 5,
      "weeklySales": 35,
      "monthlySales": 142,
      "yearlySales": 1850
    },
    "revenue": {
      "todayRevenue": 1250.00,
      "monthlyRevenue": 35000.00,
      "yearlyRevenue": 420000.00
    },
    "profit": {
      "todayProfit": 450.00,
      "monthlyProfit": 12000.00,
      "yearlyProfit": 150000.00
    },
    "purchases": {
      "totalPurchases": 200,
      "monthlyPurchases": 15,
      "purchaseValue": 250000.00
    },
    "expenses": {
      "totalExpenses": 80000.00,
      "monthlyExpenses": 5000.00
    }
  }
}
```

#### GET /api/dashboard/revenue

**Response**:
```json
{
  "success": true,
  "message": "Revenue data fetched successfully",
  "data": {
    "todayRevenue": 1250.00,
    "monthlyRevenue": 35000.00,
    "yearlyRevenue": 420000.00,
    "last7Days": [{ "date": "2026-01-10", "revenue": 2500.00 }],
    "last30Days": [{ "date": "2026-01-10", "revenue": 2500.00 }],
    "last12Months": [{ "month": "2026-01", "revenue": 35000.00 }]
  }
}
```

#### GET /api/dashboard/sales

**Response**:
```json
{
  "success": true,
  "message": "Sales data fetched successfully",
  "data": {
    "todaySales": 5,
    "weeklySales": 35,
    "monthlySales": 142,
    "yearlySales": 1850,
    "salesByPaymentMethod": [
      { "method": "CASH", "count": 80, "revenue": 18000.00 },
      { "method": "CARD", "count": 62, "revenue": 17000.00 }
    ],
    "salesByStatus": [
      { "status": "PAID", "count": 140 },
      { "status": "PENDING", "count": 2 }
    ],
    "salesTrend": [
      { "date": "2026-01-10", "count": 5, "revenue": 1250.00 }
    ]
  }
}
```

#### GET /api/dashboard/inventory

**Response**:
```json
{
  "success": true,
  "data": {
    "totalProducts": 150,
    "activeProducts": 120,
    "lowStockProducts": 15,
    "outOfStockProducts": 10,
    "discontinuedProducts": 5,
    "inventoryValue": 45000.00,
    "inventoryCost": 30000.00,
    "potentialRevenue": 45000.00,
    "stockByCategory": [
      { "categoryId": "...", "categoryName": "Electronics", "totalProducts": 30, "value": 15000.00 }
    ],
    "lowStockList": [
      { "_id": "...", "name": "Widget", "sku": "WGT-001", "currentStock": 3, "reorderLevel": 10, "status": "LOW_STOCK" }
    ]
  }
}
```

#### GET /api/dashboard/charts

**Response**:
```json
{
  "success": true,
  "data": {
    "last7DaysRevenue": [{ "date": "2026-01-10", "revenue": 2500.00 }],
    "last30DaysRevenue": [{ "date": "2026-01-10", "revenue": 2500.00 }],
    "last12MonthsRevenue": [{ "month": "2026-01", "revenue": 35000.00 }],
    "salesTrend": [{ "date": "2026-01-10", "count": 5, "revenue": 1250.00 }],
    "purchaseTrend": [{ "date": "2026-01-10", "count": 2, "value": 500.00 }],
    "expenseTrend": [{ "date": "2026-01-10", "count": 3, "value": 300.00 }]
  }
}
```

#### GET /api/dashboard/top-products

**Query**: `limit` (default 10)

**Response**:
```json
{
  "success": true,
  "data": {
    "topSelling": [{ "productId": "...", "productName": "Widget", "sku": "WGT-001", "totalQuantitySold": 200, "totalRevenue": 5000.00 }],
    "topCategories": [{ "categoryId": "...", "categoryName": "Electronics", "totalProducts": 30, "totalSold": 200, "totalRevenue": 15000.00 }],
    "topSuppliers": [{ "supplierId": "...", "supplierName": "Acme", "company": "Acme Corp", "totalProducts": 5, "totalPurchased": 10, "totalValue": 1000.00 }],
    "mostProfitable": [{ "productId": "...", "productName": "Widget", "sku": "WGT-001", "totalProfit": 3000.00, "totalQuantitySold": 200 }],
    "slowMoving": [{ "productId": "...", "productName": "Old Widget", "sku": "OW-001", "currentStock": 50, "totalSold": 2, "daysSinceLastSale": 90 }],
    "fastMoving": [{ "productId": "...", "productName": "Popular Widget", "sku": "PW-001", "currentStock": 10, "totalSold": 500, "turnoverRate": 50.00 }]
  }
}
```

#### GET /api/dashboard/warnings

**Response**:
```json
{
  "success": true,
  "data": {
    "lowStock": [{ "_id": "...", "name": "Widget", "sku": "WGT-001", "currentStock": 3, "reorderLevel": 10, "status": "LOW_STOCK" }],
    "outOfStock": [{ "_id": "...", "name": "Gadget", "sku": "GDG-001", "status": "OUT_OF_STOCK" }],
    "expiringSoon": [{ "_id": "...", "name": "Milk", "sku": "MLK-001", "expiryDate": "2026-02-01", "currentStock": 20 }],
    "withoutSupplier": [{ "_id": "...", "name": "Mystery Item", "sku": "MI-001" }],
    "inactive": [{ "_id": "...", "name": "Old Widget", "sku": "OW-001", "status": "DISCONTINUED", "isActive": false }]
  }
}
```

---

### 5.9 Settings

All routes require `requireAuth` + `requireShopAccess`.

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET` | `/api/settings/profile` | Yes | Get shop settings/profile |
| `PATCH` | `/api/settings/profile` | Yes | Update shop settings/profile |

#### GET /api/settings/profile

Returns the shop's settings document. If none exists, creates default settings from the Shop model.

#### PATCH /api/settings/profile

**Body** (all optional):
```json
{
  "businessName": "My Business",
  "logo": "https://...",
  "phone": "+1234567890",
  "email": "business@example.com",
  "address": "123 Main St",
  "currency": "USD",
  "timezone": "America/New_York",
  "taxPercentage": 8.5,
  "invoicePrefix": "INV-",
  "lowStockThreshold": 15,
  "businessType": "Retail"
}
```

**Note**: Key fields (`businessName`, `logo`, `phone`, `email`, `address`, `currency`, `timezone`, `businessType`) are synced back to the `Shop` model.

---

### 5.10 AI Knowledge

All routes require `requireAuth` + `requireShopAccess`.

| Method | URL | Auth | Description |
|---|---|---|---|
| `POST` | `/api/ai/knowledge/upload` | Yes | Upload a document (PDF, DOCX, TXT, CSV) |
| `GET` | `/api/ai/knowledge` | Yes | List knowledge documents |
| `GET` | `/api/ai/knowledge/chat/history` | Yes | Get chat history (paginated) |
| `POST` | `/api/ai/knowledge/chat` | Yes | Ask a question |
| `GET` | `/api/ai/knowledge/:id` | Yes | Get document + chunks |
| `GET` | `/api/ai/knowledge/:id/text` | Yes | Get extracted text |
| `PATCH` | `/api/ai/knowledge/:id` | Yes | Update document (rename) |
| `DELETE` | `/api/ai/knowledge/:id` | Yes | Delete document + chunks |

#### POST /api/ai/knowledge/upload

**Content-Type**: `multipart/form-data`

**Field**: `file` (single file)

**Accepted Types**: PDF (`application/pdf`), DOCX (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`), TXT (`text/plain`), CSV (`text/csv`)

**Max Size**: 20 MB

**Response**:
```json
{
  "success": true,
  "message": "Knowledge document uploaded successfully",
  "data": {
    "_id": "...",
    "fileName": "business-plan.pdf",
    "fileType": "pdf",
    "cloudinaryUrl": "https://...",
    "status": "PENDING",
    "analysis": { "summary": "", "businessInsights": "", "keywords": [], "recommendedActions": [] }
  }
}
```

**Note**: Document processing (text extraction, chunking, Gemini analysis) happens asynchronously. The status transitions: `PENDING` -> `PROCESSING` -> `COMPLETED` (or `FAILED`).

#### POST /api/ai/knowledge/chat

**Body**:
```json
{
  "question": "What was our best selling product last month?"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Chat response generated successfully",
  "data": {
    "answer": "Based on the business documents, your best selling product last month was...",
    "sources": [
      { "documentId": "...", "fileName": "sales-report.pdf", "chunkIndex": 3 }
    ]
  }
}
```

#### GET /api/ai/knowledge

**Query**: `page`, `limit`, `search` (fileName, keywords), `fileType`, `status`

**Response**: Paginated list of documents (without `extractedText`).

---

### 5.11 Barcode

All routes require `requireAuth` + `requireShopAccess`.

| Method | URL | Auth | Description |
|---|---|---|---|
| `POST` | `/api/barcodes/generate/:productId` | Yes | Auto-generate Code128 barcode |
| `PATCH` | `/api/barcodes/custom/:productId` | Yes | Set custom barcode |
| `GET` | `/api/barcodes/svg` | Yes | Get SVG barcode image |
| `GET` | `/api/barcodes/qr/:productId` | Yes | Get QR code PNG for product |
| `POST` | `/api/barcodes/sheet` | Yes | Generate barcode PDF sheet |
| `POST` | `/api/barcodes/qr-sheet` | Yes | Generate QR code PDF sheet |

#### POST /api/barcodes/generate/:productId

**Response**:
```json
{
  "success": true,
  "message": "Barcode generated successfully",
  "data": {
    "productId": "...",
    "barcode": "1234567890123"
  }
}
```

**Error**: 400 if product already has a barcode.

#### GET /api/barcodes/svg

**Query**: `text` (the barcode text to encode)

**Response**: Raw SVG (`Content-Type: image/svg+xml`)

#### GET /api/barcodes/qr/:productId

**Response**: Raw PNG (`Content-Type: image/png`)

QR data contains: `{ name, sku, barcode, brand, price, stock, unit }`

#### POST /api/barcodes/sheet

**Body**:
```json
{
  "productIds": ["ObjectId1", "ObjectId2"],
  "labelsPerRow": 3,    // optional, default 3
  "showPrice": true,    // optional, default true
  "showName": true      // optional, default true
}
```

**Response**: PDF buffer (`Content-Type: application/pdf`, `Content-Disposition: attachment; filename=barcode-sheet.pdf`)

#### POST /api/barcodes/qr-sheet

Same as barcode sheet but generates QR codes instead.

---

### 5.12 Import/Export

All routes require `requireAuth` + `requireShopAccess`.

| Method | URL | Auth | Description |
|---|---|---|---|
| `POST` | `/api/import-export/import/:entity` | Yes | Import data from CSV/Excel |
| `GET` | `/api/import-export/export/:entity` | Yes | Export data to CSV/Excel/PDF |

**Valid Entities**: `products`, `categories`, `suppliers`

#### POST /api/import-export/import/:entity

**Content-Type**: `multipart/form-data`

**Field**: `file` (single file)

**Accepted Types**: CSV (`.csv`), Excel (`.xlsx`, `.xls`)

**Max Size**: 10 MB

**Response**:
```json
{
  "success": true,
  "message": "Import completed",
  "data": {
    "totalRows": 50,
    "successful": 45,
    "failed": 5,
    "errors": [
      { "row": 12, "field": "name", "message": "Name is required" },
      { "row": 25, "field": "sku", "message": "SKU \"ABC-001\" already exists" }
    ]
  }
}
```

**Required CSV Columns**:
- Products: `name` (required), `purchasePrice` (required), `sellingPrice` (required), `description`, `sku`, `barcode`, `brand`, `categoryId`, `supplierId`, `currentStock`, `minimumStock`, `maximumStock`, `reorderLevel`, `unit`
- Categories: `name` (required), `description`, `color`, `icon`
- Suppliers: `name` (required), `phone` (required), `company`, `email`, `address`, `tradeLicense`, `notes`

#### GET /api/import-export/export/:entity

**Query**: `format` (csv, excel, pdf)

**Response**: File download with appropriate `Content-Type` and `Content-Disposition`.

---

### 5.13 Notifications

All routes require `requireAuth` + `requireShopAccess`.

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Yes | List notifications (paginated) |
| `GET` | `/api/notifications/unread-count` | Yes | Get unread count |
| `PATCH` | `/api/notifications/:id/read` | Yes | Mark single as read |
| `PATCH` | `/api/notifications/read-all` | Yes | Mark all as read |
| `DELETE` | `/api/notifications/:id` | Yes | Delete single notification |
| `DELETE` | `/api/notifications` | Yes | Delete all notifications |
| `POST` | `/api/notifications/generate/inventory` | Yes | Generate inventory alerts |
| `POST` | `/api/notifications/generate/sales-summary` | Yes | Generate monthly sales summary |
| `POST` | `/api/notifications/generate/profit-summary` | Yes | Generate monthly profit summary |

#### GET /api/notifications

**Query**: `page`, `limit` (default 20)

**Response**:
```json
{
  "success": true,
  "message": "Notifications fetched successfully",
  "data": {
    "notifications": [INotification],
    "total": 50,
    "unreadCount": 12
  }
}
```

#### GET /api/notifications/unread-count

**Response**:
```json
{
  "success": true,
  "message": "Unread count fetched successfully",
  "data": { "count": 12 }
}
```

---

### 5.14 Reports

All routes require `requireAuth` + `requireShopAccess`.

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET` | `/api/reports/sales` | Yes | Sales report |
| `GET` | `/api/reports/purchases` | Yes | Purchase report |
| `GET` | `/api/reports/inventory` | Yes | Inventory report |
| `GET` | `/api/reports/expenses` | Yes | Expense report |
| `GET` | `/api/reports/profit` | Yes | Profit report |
| `GET` | `/api/reports/revenue` | Yes | Revenue report |
| `GET` | `/api/reports/export/:type` | Yes | Export report to file |

**Common Query Parameters for all report endpoints**:
- `dateRange`: `today` | `thisWeek` | `thisMonth` | `thisYear` | `last7Days` | `last30Days` | `custom` (default: `thisMonth`)
- `startDate`: ISO datetime (only for `custom`)
- `endDate`: ISO datetime (only for `custom`)

#### GET /api/reports/sales

**Response**:
```json
{
  "success": true,
  "data": {
    "period": { "start": "Jan 1, 2026", "end": "Jan 31, 2026" },
    "summary": {
      "totalSales": 142,
      "totalRevenue": 35000.00,
      "totalDiscount": 1500.00,
      "totalTax": 2800.00,
      "averageSaleValue": 246.48
    },
    "byPaymentMethod": [{ "method": "CASH", "count": 80, "revenue": 18000.00 }],
    "byPaymentStatus": [{ "status": "PAID", "count": 140 }],
    "dailyTrend": [{ "date": "2026-01-15", "count": 5, "revenue": 1250.00 }],
    "topProducts": [{ "productName": "Widget", "sku": "WGT-001", "quantitySold": 50, "revenue": 1250.00 }],
    "chartData": {
      "dailyRevenue": [{ "label": "2026-01-15", "value": 1250.00 }],
      "paymentMethodDistribution": [{ "label": "CASH", "value": 18000.00 }]
    }
  }
}
```

#### GET /api/reports/profit

**Response**:
```json
{
  "success": true,
  "data": {
    "period": { "start": "Jan 1, 2026", "end": "Jan 31, 2026" },
    "summary": {
      "totalRevenue": 35000.00,
      "totalCostOfGoods": 20000.00,
      "totalExpenses": 5000.00,
      "grossProfit": 15000.00,
      "netProfit": 10000.00,
      "grossMargin": 42.86,
      "netMargin": 28.57
    },
    "dailyTrend": [{ "date": "2026-01-15", "revenue": 1250.00, "cost": 700.00, "profit": 550.00 }],
    "chartData": {
      "dailyProfit": [{ "label": "2026-01-15", "value": 550.00 }],
      "marginTrend": [{ "label": "2026-01-15", "value": 44.00 }]
    }
  }
}
```

#### GET /api/reports/export/:type

**Params**: `type` (sales, purchases, inventory, expenses, profit, revenue)

**Query**: `format` (csv, excel, pdf), `dateRange`, `startDate`, `endDate`

**Response**: File download.

---

## 6. Services

| Service | File | Business Logic |
|---|---|---|
| **shop.service** | `src/services/shop.service.ts` | CRUD for shops. Slug uniqueness per owner. Soft delete. Pagination with search. |
| **category.service** | `src/services/category.service.ts` | CRUD for categories. Name uniqueness per shop. Soft delete. |
| **supplier.service** | `src/services/supplier.service.ts` | CRUD for suppliers. Name uniqueness per shop. Pagination with search + isActive filter. Soft delete. |
| **product.service** | `src/services/product.service.ts` | CRUD for products. Auto-generates SKU if not provided. Validates category/supplier ownership. Calculates profit margin. Auto-determines status (ACTIVE/LOW_STOCK/OUT_OF_STOCK). Populates category and supplier on queries. Stock update endpoint. Statistics aggregation. Low stock + out-of-stock queries. |
| **purchase.service** | `src/services/purchase.service.ts` | CRUD for purchases. Auto-generates invoice number. Validates supplier and product ownership. Calculates subtotal/discount/tax/total. **Increases stock on create, decreases on delete**. On update: reverses old stock, applies new stock. Statistics aggregation. |
| **sale.service** | `src/services/sale.service.ts` | CRUD for sales. Auto-generates invoice number. Validates stock availability before sale. Denormalizes product data (name, sku, barcode, prices). Calculates profitPerUnit. **Decreases stock on create, increases on delete/refund**. Refund logic. Statistics with optional date range. Top products aggregation. |
| **expense.service** | `src/services/expense.service.ts` | CRUD for expenses. Pagination with multi-field filtering (search, category, paymentMethod, date range). Custom sorting. Statistics with category/payment breakdown and monthly trend. |
| **dashboard.service** | `src/services/dashboard.service.ts` | Aggregates data from Product, Sale, Purchase, Expense collections. 7 methods: overview, revenue, sales, inventory, charts, topProducts, warnings. Heavy use of MongoDB aggregation pipelines. |
| **settings.service** | `src/services/settings.service.ts` | Get/update shop settings. Creates default settings from Shop data if none exist. Syncs key fields back to Shop model on update. |
| **ai-knowledge.service** | `src/services/ai-knowledge.service.ts` | Document upload to Cloudinary. Text extraction (PDF via pdf-parse, DOCX via mammoth, TXT/CSV raw). Text normalization + chunking (~650 words/chunk). Gemini analysis (summary, insights, keywords, actions). Keyword-based chunk search with relevance scoring. Chat with RAG (context from chunks -> Gemini). Chat history storage. |
| **barcode.service** | `src/services/barcode.service.ts` | Custom Code128-B barcode implementation (encoding, SVG generation). Barcode assignment to products. Custom barcode setting. QR code generation (product info JSON). PDF sheet generation for barcodes and QR codes using pdfkit. |
| **import-export.service** | `src/services/import-export.service.ts` | CSV parsing (custom, handles quoted fields). Excel parsing via exceljs. Product/category/supplier import with validation (duplicate detection, required fields). CSV/Excel/PDF export for products/categories/suppliers. |
| **notification.service** | `src/services/notification.service.ts` | Generates inventory alerts (out of stock, low stock, expiring). Monthly sales summary notification. Monthly profit summary notification. CRUD for notifications (list, mark read, delete). Duplicate notification prevention. |
| **report.service** | `src/services/report.service.ts` | 6 report types: sales, purchases, inventory, expenses, profit, revenue. Date range calculation (today, thisWeek, thisMonth, thisYear, last7Days, last30Days, custom). Heavy MongoDB aggregation. CSV generation. PDF generation via pdfkit. Excel generation via exceljs. Chart data included in each report. |

---

## 7. Controllers

| Controller | File | Endpoints |
|---|---|---|
| **shop.controller** | `src/controllers/shop.controller.ts` | `createShopHandler`, `getShopHandler`, `listShopsHandler`, `updateShopHandler`, `deleteShopHandler` |
| **category.controller** | `src/controllers/category.controller.ts` | `createCategoryHandler`, `listCategoriesHandler`, `getCategoryHandler`, `updateCategoryHandler`, `deleteCategoryHandler` |
| **supplier.controller** | `src/controllers/supplier.controller.ts` | `createSupplierHandler`, `listSuppliersHandler`, `getSupplierHandler`, `updateSupplierHandler`, `deleteSupplierHandler` |
| **product.controller** | `src/controllers/product.controller.ts` | `createProductHandler`, `listProductsHandler`, `getProductHandler`, `updateProductHandler`, `deleteProductHandler`, `updateStockHandler`, `getProductStatisticsHandler`, `getLowStockProductsHandler`, `getOutOfStockProductsHandler` |
| **purchase.controller** | `src/controllers/purchase.controller.ts` | `createPurchaseHandler`, `listPurchasesHandler`, `getPurchaseHandler`, `updatePurchaseHandler`, `deletePurchaseHandler`, `getPurchaseStatisticsHandler` |
| **sale.controller** | `src/controllers/sale.controller.ts` | `createSaleHandler`, `listSalesHandler`, `getSaleHandler`, `updateSaleHandler`, `deleteSaleHandler`, `refundSaleHandler`, `getSaleStatisticsHandler`, `getTopProductsHandler` |
| **expense.controller** | `src/controllers/expense.controller.ts` | `createExpenseHandler`, `getExpensesHandler`, `getExpenseByIdHandler`, `updateExpenseHandler`, `deleteExpenseHandler`, `getExpenseStatisticsHandler` |
| **dashboard.controller** | `src/controllers/dashboard.controller.ts` | `getOverviewHandler`, `getRevenueHandler`, `getSalesHandler`, `getInventoryHandler`, `getChartsHandler`, `getTopProductsHandler`, `getWarningsHandler` |
| **settings.controller** | `src/controllers/settings.controller.ts` | `getProfileHandler`, `updateProfileHandler` |
| **ai-knowledge.controller** | `src/controllers/ai-knowledge.controller.ts` | `uploadKnowledgeHandler`, `listKnowledgeHandler`, `getKnowledgeHandler`, `deleteKnowledgeHandler`, `updateKnowledgeHandler`, `getExtractedTextHandler`, `chatHandler`, `getChatHistoryHandler` |
| **barcode.controller** | `src/controllers/barcode.controller.ts` | `generateBarcodeHandler`, `setCustomBarcodeHandler`, `getBarcodeSVGHandler`, `generateQRCodeHandler`, `generateBarcodeSheetHandler`, `generateQRSheetHandler` |
| **import-export.controller** | `src/controllers/import-export.controller.ts` | `importHandler`, `exportHandler` |
| **notification.controller** | `src/controllers/notification.controller.ts` | `getNotificationsHandler`, `getUnreadCountHandler`, `markAsReadHandler`, `markAllAsReadHandler`, `deleteNotificationHandler`, `deleteAllNotificationsHandler`, `generateInventoryAlertsHandler`, `generateMonthlySalesSummaryHandler`, `generateMonthlyProfitSummaryHandler` |
| **report.controller** | `src/controllers/report.controller.ts` | `getSalesReportHandler`, `getPurchaseReportHandler`, `getInventoryReportHandler`, `getExpenseReportHandler`, `getProfitReportHandler`, `getRevenueReportHandler`, `exportReportHandler` |

All controllers use `asyncHandler` wrapper for error propagation and `sendResponse` for standardized responses.

---

## 8. Middleware

### Execution Order (per request)

1. **Global middleware** (applied in `app.ts`):
   - `helmet()` - Security headers
   - `cors()` - CORS with `credentials: true`
   - `compression()` - gzip compression
   - `express.json()` - JSON body parsing
   - `express.urlencoded()` - URL-encoded body parsing
   - `cookieParser()` - Cookie parsing
   - `morgan("dev")` - HTTP request logging
   - `rateLimit()` - 100 requests per 15-minute window on `/api`

2. **Route-level middleware** (applied per router):
   - `requireAuth` - Async. Verifies session cookie with Better Auth. Sets `req.user`.
   - `requireShopAccess` - Async. Verifies `req.user.shopId` exists and Shop is active.
   - `requireOwner` - Sync. Checks `req.user.role === "owner"`.
   - `requireStaff` - Sync. Checks role is `owner` or `staff`.
   - `validateRequest(schema)` - Sync. Parses and validates `req.body`, `req.query`, `req.params` against Zod schema.

3. **404 handler** - Catches unmatched routes.

4. **errorHandler** - Global error handler. Returns `AppError` with specific status code. In development, includes stack trace.

---

## 9. Utilities

| Utility | File | Purpose |
|---|---|---|
| **AppError** | `src/utils/AppError.ts` | Custom error class with `statusCode` and `isOperational` flag. Used throughout services to throw typed errors. |
| **asyncHandler** | `src/utils/asyncHandler.ts` | Wraps async route handlers to catch rejected promises and forward to Express error middleware. |
| **logger** | `src/utils/logger.ts` | Simple console logger with ISO timestamps and levels: `info`, `warn`, `error`, `debug` (debug only in development). |
| **sendResponse** | `src/utils/response.ts` | Standardized JSON response helper. Sets `success` based on status code range (2xx = true). |

---

## 10. File Upload

### Cloudinary Configuration

- Configured in `src/config/cloudinary.ts`
- Uses env vars: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Folder: `inventraai/knowledge` (for AI documents)

### Storage Flow

1. **Knowledge Documents**: Uploaded via multer (memory storage) -> Extracted text -> Uploaded to Cloudinary (as raw resource) -> Stored URL in KnowledgeDocument
2. **Expense Receipts**: `receiptImage` field stores a Cloudinary URL (upload handled by frontend or separate endpoint - not in current codebase)

### Accepted File Types

| Module | Accepted MIME Types | Max Size |
|---|---|---|
| AI Knowledge Upload | `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`, `text/csv` | 20 MB |
| Import (CSV/Excel) | `text/csv`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/octet-stream` + `.csv`/`.xlsx`/`.xls` extension check | 10 MB |

### Multer Configuration

- **Storage**: `multer.memoryStorage()` (files buffered in memory, not disk)
- **Knowledge upload**: `fileFilter` validates MIME types, `limits.fileSize` = 20MB
- **Import upload**: `fileFilter` validates MIME types + file extensions, `limits.fileSize` = 10MB

---

## 11. AI Module

### Knowledge Storage

1. User uploads document (PDF/DOCX/TXT/CSV)
2. File uploaded to Cloudinary (raw resource)
3. `KnowledgeDocument` created with status `PENDING`
4. Background processing starts (`processDocument`):

   a. **Text Extraction**:
      - PDF: `pdf-parse` library
      - DOCX: `mammoth` library
      - TXT/CSV: `Buffer.toString("utf-8")`

   b. **Text Normalization**: Removes `\r\n`, tabs, extra spaces, excessive newlines

   c. **Chunking**: Splits text into ~650-word chunks. Breaks at sentence boundaries (periods) or newlines when possible. Filters out chunks < 10 words.

   d. **Knowledge Chunks Stored**: Each chunk stored as `KnowledgeChunk` with content, chunkIndex, wordCount

   e. **Gemini Analysis**: Sends first 8000 chars to Gemini with prompt asking for summary, business insights, keywords, recommended actions. Response parsed as JSON.

   f. **Status Update**: `COMPLETED` on success, `FAILED` on error

### Gemini Integration

- Model: `gemini-2.0-flash`
- API Key: `GEMINI_API_KEY`
- Temperature: 0.3 (low, for factual responses)
- Max Output Tokens: 2000 (analysis) / 1500 (chat)
- Dynamic import: `@google/genai`

### Chat Flow (RAG)

1. User asks a question
2. **Chunk Search** (`searchRelevantChunks`):
   - Extracts keywords from question (words > 2 chars)
   - Regex search across `KnowledgeChunk.content`
   - Scores chunks by keyword frequency
   - Returns top 5 most relevant chunks
3. **Context Assembly**: Chunks formatted with source document names
4. **Gemini Chat**: Prompt includes "You are a helpful business assistant" system prompt + context + user question
5. **Response Storage**: Q&A + sources saved to `ChatHistory`
6. **Fallback**: If no relevant chunks, returns generic "no information found" message

### Prompt Flow

**Analysis Prompt** (document upload):
```
Analyze the following business document and provide:
1. A concise summary (2-3 paragraphs)
2. Key business insights (bullet points)
3. Relevant keywords (array of strings, max 15)
4. Recommended actions for the business owner (array of strings, max 10)
```

**Chat Prompt**:
```
You are a helpful business assistant for an inventory management system.
Answer the user's question based ONLY on the provided business knowledge below.
If the answer cannot be found in the provided context, say "I couldn't find this information in your business knowledge."
```

---

## 12. Dashboard Metrics

### Overview (`/api/dashboard/overview`)

| Metric | Calculation |
|---|---|
| `inventory.totalProducts` | `Product.countDocuments({ shopId, isDeleted: false })` |
| `inventory.activeProducts` | Count where `status === ACTIVE` |
| `inventory.lowStockProducts` | Count where `status === LOW_STOCK` |
| `inventory.outOfStockProducts` | Count where `status === OUT_OF_STOCK` |
| `inventory.inventoryValue` | `SUM(currentStock * sellingPrice)` |
| `inventory.inventoryCost` | `SUM(currentStock * purchasePrice)` |
| `sales.todaySales` | `Sale.countDocuments` where `saleDate >= todayStart` and not refunded |
| `sales.weeklySales` | Same, from start of current week |
| `sales.monthlySales` | Same, from start of current month |
| `sales.yearlySales` | Same, from start of current year |
| `revenue.todayRevenue` | `SUM(grandTotal)` for today's non-refunded sales |
| `revenue.monthlyRevenue` | Same, current month |
| `revenue.yearlyRevenue` | Same, current year |
| `profit.todayProfit` | `SUM(profitPerUnit * quantity)` from today's sale items |
| `profit.monthlyProfit` | Same, current month |
| `profit.yearlyProfit` | Same, current year |
| `purchases.totalPurchases` | `Purchase.countDocuments` |
| `purchases.monthlyPurchases` | Count from start of month |
| `purchases.purchaseValue` | `SUM(total)` |
| `expenses.totalExpenses` | `SUM(amount)` from Expense collection |
| `expenses.monthlyExpenses` | Same, current month |

### Revenue (`/api/dashboard/revenue`)

Returns today/monthly/yearly revenue + `last7Days` (daily aggregation), `last30Days` (daily), `last12Months` (monthly) arrays for charting.

### Sales (`/api/dashboard/sales`)

Returns today/weekly/monthly/yearly counts + `salesByPaymentMethod`, `salesByStatus`, `salesTrend` (last 30 days daily).

### Inventory (`/api/dashboard/inventory`)

Returns status counts + value metrics + `stockByCategory` (aggregated with $lookup to categories) + `lowStockList` (top 20 worst stock items).

### Charts (`/api/dashboard/charts`)

Returns `last7DaysRevenue`, `last30DaysRevenue`, `last12MonthsRevenue`, `salesTrend`, `purchaseTrend`, `expenseTrend` - all daily aggregations for the last 30 days.

### Top Products (`/api/dashboard/top-products`)

Returns 6 sub-arrays:
- `topSelling`: Products ranked by `totalQuantitySold`
- `topCategories`: Categories ranked by `totalRevenue` (via $lookup)
- `topSuppliers`: Suppliers ranked by `totalValue` (via $lookup)
- `mostProfitable`: Products ranked by `totalProfit`
- `slowMoving`: Products sorted by `daysSinceLastSale` (descending)
- `fastMoving`: Products sorted by `turnoverRate` (totalSold / currentStock)

### Warnings (`/api/dashboard/warnings`)

Returns 5 arrays:
- `lowStock`: Products with `status === LOW_STOCK`
- `outOfStock`: Products with `status === OUT_OF_STOCK`
- `expiringSoon`: Products with `expiryDate` within next 30 days
- `withoutSupplier`: Products without supplier (shouldn't exist per schema but checked)
- `inactive`: Products with `isActive === false` or `status === DISCONTINUED`

---

## 13. Security

### Validation

- **Zod schemas** validate all request bodies, query parameters, and route params
- 7 validator files covering: Shop, Category, Supplier, Product, Purchase, Sale, Expense
- ObjectIds validated with regex: `/^[0-9a-fA-F]{24}$/`
- Enums validated against actual TypeScript enums
- Required fields, string lengths, number ranges all enforced
- Error messages are descriptive: `"field.subfield: message"`

### Sanitization

- `helmet()` sets security HTTP headers
- Input strings trimmed via Mongoose `trim: true`
- Lowercase enforced on emails
- Regex-based injection via `$regex` searches (user input used in regex - potential ReDoS not mitigated)
- `express.json()` has default body size limit

### Rate Limiting

- **Global**: 100 requests per 15-minute window on all `/api` routes
- Uses `express-rate-limit` with `standardHeaders: true` (returns rate limit info in `RateLimit-*` headers)
- Response: `{ success: false, message: "Too many requests, try again later" }`

### CORS

- Origin: `BETTER_AUTH_URL` (default `http://localhost:3000`)
- Credentials: `true` (allows cookies)

### Authentication

- Session verification delegated to external Better Auth service
- Cookie-based authentication (HTTP-only cookies)
- No JWT handling on the backend

### Authorization

- **Role-based**: `owner` (full access) vs `staff` (access data, no shop management)
- **Shop-based**: All data queries scoped by `shopId`
- Shop operations require `ownerId` match

### Multi-Tenant Protection

- Every service function takes `shopId` as first parameter
- Every MongoDB query includes `{ shopId }` filter
- `requireShopAccess` middleware validates shop exists
- Shop CRUD additionally checks `ownerId === req.user.id`
- Unique indexes are scoped per shop (e.g., `{shopId, slug}`, `{shopId, name}`)

---

## 14. Missing Features

| Feature | Status | Notes |
|---|---|---|
| **User Registration/Login** | Not in backend | Handled by external Better Auth service. Backend only verifies sessions. |
| **File upload for product images** | Not implemented | `images` field exists on Product but no upload endpoint. Frontend must upload to Cloudinary separately. |
| **Expense receipt upload** | Not implemented | `receiptImage` field exists but no upload endpoint. |
| **Shop logo upload** | Not implemented | `logo` field exists but no upload endpoint. |
| **Webhooks / Real-time** | Not implemented | No WebSocket or webhook support. |
| **Subscription billing** | Not implemented | `subscriptionPlan`/`subscriptionStatus` fields exist on Shop but no billing logic. |
| **Email notifications** | Not implemented | Only in-app notifications. No email/SMS sending. |
| **Audit logging** | Not implemented | No request logging beyond `morgan`. |
| **Two-factor auth** | Not implemented | |
| **Password management** | Not in backend | Handled by Better Auth. |
| **Staff invitation/management** | Not implemented | No staff management endpoints. |
| **Data backup** | Not implemented | |
| **Inventory transfer between shops** | Not implemented | |
| **Purchase order workflow** | Not implemented | Purchases are simple CRUD. |
| **Customer management** | Not implemented | Customer name/phone stored on Sale but no Customer model. |

---

## 15. Technical Debt

### Unused Files

| File | Issue |
|---|---|
| `src/interfaces/` | Empty directory - no interface files |
| `src/config/better-auth.ts` | Exports `BetterAuthUser`, `BetterAuthSession`, `BetterAuthSessionResult` interfaces that are only used internally |
| `JWT_SECRET` in .env | Referenced in `.env` but never used in code |
| `JWT_EXPIRES_IN` in .env | Referenced in `.env` but never used in code |

### Duplicate Code

| Pattern | Files | Issue |
|---|---|---|
| `determineStatus()` | `product.service.ts`, `purchase.service.ts`, `sale.service.ts`, `import-export.service.ts` | Same logic duplicated in 4 places |
| `increaseStock()` / `decreaseStock()` | `purchase.service.ts`, `sale.service.ts` | Nearly identical functions in both services |
| `generateInvoiceNumber()` | `purchase.service.ts`, `sale.service.ts` | Same pattern with different prefixes (`PUR-` vs `INV-`) |
| `generateSku()` | `product.service.ts`, `import-export.service.ts` | Same SKU generation logic |
| Pagination interface | Multiple services | `PaginationResult` interface redeclared in each service |
| `round()` | `dashboard.service.ts`, `report.service.ts` | Same utility duplicated |

### Potential Bugs

| Issue | Location | Description |
|---|---|---|
| Race condition on stock operations | `sale.service.ts:48-80`, `purchase.service.ts:38-63` | Stock read/modify/write is not atomic. Concurrent sales could oversell. |
| PDF export returns empty buffer | `import-export.service.ts:699` | `exportPDF` returns `Buffer.from([])` instead of the actual PDF buffer (the `on("end")` handler is lost). |
| Expense `deleteExpense` missing `$set` | `expense.service.ts:192` | Uses `{ isDeleted: true }` without `$set`, which replaces the entire document. |
| `monthlyComparison` always empty | `report.service.ts:725` | `getRevenueReport` returns `monthlyComparison: []` - not implemented. |
| `withoutSupplier` query ineffective | `dashboard.service.ts:1177-1182` | Queries `{ supplierId: { $exists: false } }` but `supplierId` is required in schema, so this will always return empty. |
| Missing `$set` in notification delete | `notification.service.ts:273` | `findOneAndUpdate` uses `{ isDeleted: true }` without `$set` - same issue as expense. |

### Type Safety Issues

| Issue | Location | Description |
|---|---|---|
| `req.user!` non-null assertions | All controllers | Used extensively without runtime check after middleware. |
| `as unknown as` casts | `purchase.service.ts:154`, `sale.service.ts:123` | Mongoose ObjectId casting workarounds. |
| `any` return type | `asyncHandler.ts:5` | `Promise<any>` loses type information. |
| Dynamic `import()` in production | `ai-knowledge.service.ts:27,114` | `pdf-parse` and `@google/genai` imported dynamically. |

### Performance Improvements

| Issue | Location | Description |
|---|---|---|
| N+1 queries in `createSale` | `sale.service.ts:136-174` | Each item triggers individual `Product.findOne` query. |
| N+1 queries in `createPurchase` | `purchase.service.ts:119-132` | Same issue. |
| No connection pooling config | `config/db.ts` | Uses default Mongoose connection options. |
| Synchronous barcode generation | `barcode.service.ts:48-64` | Code128 encoding is CPU-intensive for large datasets. |
| Dashboard queries not cached | `dashboard.service.ts` | Heavy aggregation pipelines run on every request. |
| No pagination on category list | `category.service.ts:27-33` | Returns all categories without pagination. |

---

## 16. Frontend Integration Guide

### Base URL

```
http://localhost:5000/api
```

### Authentication

All requests must include session cookie from Better Auth. Use `credentials: "include"` in fetch/axios.

### Response Wrapper

Every response follows:
```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}
```

### Pagination Pattern

Most list endpoints return:
```typescript
interface PaginatedResponse<T> {
  [entities]: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

### Shop

| Endpoint | Purpose | Request | Response | React Query Key | Zustand Store |
|---|---|---|---|---|---|
| `GET /shops` | List user's shops | `?page=&limit=&search=` | `PaginatedResponse<Shop>` | `["shops", { page, search }]` | `useShopStore` |
| `GET /shops/:id` | Get shop detail | - | `Shop` | `["shop", id]` | `useShopStore` |
| `POST /shops` | Create shop | `CreateShopBody` | `Shop` | Invalidate `["shops"]` | `useShopStore` |
| `PUT /shops/:id` | Update shop | `UpdateShopBody` | `Shop` | Invalidate `["shops", "shop"]` | `useShopStore` |
| `DELETE /shops/:id` | Delete shop | - | `null` | Invalidate `["shops"]` | `useShopStore` |

---

### Category

| Endpoint | Purpose | Request | Response | React Query Key | Zustand Store |
|---|---|---|---|---|---|
| `GET /categories` | List all categories | - | `Category[]` | `["categories"]` | `useCategoryStore` |
| `GET /categories/:id` | Get category | - | `Category` | `["category", id]` | `useCategoryStore` |
| `POST /categories` | Create category | `{ name, description?, color?, icon? }` | `Category` | Invalidate `["categories"]` | `useCategoryStore` |
| `PUT /categories/:id` | Update category | `{ name?, description?, color?, icon?, isActive? }` | `Category` | Invalidate `["categories"]` | `useCategoryStore` |
| `DELETE /categories/:id` | Delete category | - | `null` | Invalidate `["categories"]` | `useCategoryStore` |

---

### Supplier

| Endpoint | Purpose | Request | Response | React Query Key | Zustand Store |
|---|---|---|---|---|---|
| `GET /suppliers` | List suppliers | `?page=&limit=&search=&isActive=` | `PaginatedResponse<Supplier>` | `["suppliers", { page, search }]` | `useSupplierStore` |
| `GET /suppliers/:id` | Get supplier | - | `Supplier` | `["supplier", id]` | `useSupplierStore` |
| `POST /suppliers` | Create supplier | `CreateSupplierBody` | `Supplier` | Invalidate `["suppliers"]` | `useSupplierStore` |
| `PATCH /suppliers/:id` | Update supplier | `UpdateSupplierBody` | `Supplier` | Invalidate `["suppliers"]` | `useSupplierStore` |
| `DELETE /suppliers/:id` | Delete supplier | - | `null` | Invalidate `["suppliers"]` | `useSupplierStore` |

---

### Product

| Endpoint | Purpose | Request | Response | React Query Key | Zustand Store |
|---|---|---|---|---|---|
| `GET /products` | List products | `?page=&limit=&search=&categoryId=&supplierId=&status=&brand=&lowStock=&outOfStock=&isActive=&sort=` | `PaginatedResponse<Product>` | `["products", { page, filters }]` | `useProductStore` |
| `GET /products/statistics` | Product stats | - | `ProductStatistics` | `["products", "statistics"]` | `useProductStore` |
| `GET /products/low-stock` | Low stock list | - | `Product[]` | `["products", "low-stock"]` | `useProductStore` |
| `GET /products/out-of-stock` | Out of stock list | - | `Product[]` | `["products", "out-of-stock"]` | `useProductStore` |
| `GET /products/:id` | Get product detail | - | `Product` (with populated category/supplier) | `["product", id]` | `useProductStore` |
| `POST /products` | Create product | `CreateProductBody` | `Product` | Invalidate `["products"]` | `useProductStore` |
| `PATCH /products/:id` | Update product | `UpdateProductBody` | `Product` | Invalidate `["products", "product"]` | `useProductStore` |
| `DELETE /products/:id` | Delete product | - | `null` | Invalidate `["products"]` | `useProductStore` |
| `PATCH /products/:id/stock` | Update stock | `{ currentStock: number }` | `Product` | Invalidate `["products"]` | `useProductStore` |

---

### Purchase

| Endpoint | Purpose | Request | Response | React Query Key | Zustand Store |
|---|---|---|---|---|---|
| `GET /purchases` | List purchases | `?page=&limit=&search=&supplierId=&paymentStatus=&startDate=&endDate=` | `PaginatedResponse<Purchase>` | `["purchases", { page, filters }]` | `usePurchaseStore` |
| `GET /purchases/statistics` | Purchase stats | - | `PurchaseStatistics` | `["purchases", "statistics"]` | `usePurchaseStore` |
| `GET /purchases/:id` | Get purchase detail | - | `Purchase` | `["purchase", id]` | `usePurchaseStore` |
| `POST /purchases` | Create purchase | `CreatePurchaseBody` | `Purchase` | Invalidate `["purchases", "products"]` | `usePurchaseStore` |
| `PATCH /purchases/:id` | Update purchase | `UpdatePurchaseBody` | `Purchase` | Invalidate `["purchases", "products"]` | `usePurchaseStore` |
| `DELETE /purchases/:id` | Delete purchase | - | `null` | Invalidate `["purchases", "products"]` | `usePurchaseStore` |

---

### Sale

| Endpoint | Purpose | Request | Response | React Query Key | Zustand Store |
|---|---|---|---|---|---|
| `GET /sales` | List sales | `?page=&limit=&search=&paymentMethod=&paymentStatus=&startDate=&endDate=` | `PaginatedResponse<Sale>` | `["sales", { page, filters }]` | `useSaleStore` |
| `GET /sales/statistics` | Sale stats | `?startDate=&endDate=` | `SaleStatistics` | `["sales", "statistics"]` | `useSaleStore` |
| `GET /sales/top-products` | Top products | `?limit=&startDate=&endDate=` | `TopProduct[]` | `["sales", "top-products"]` | `useSaleStore` |
| `GET /sales/:id` | Get sale detail | - | `Sale` | `["sale", id]` | `useSaleStore` |
| `POST /sales` | Create sale | `CreateSaleBody` | `Sale` | Invalidate `["sales", "products", "dashboard"]` | `useSaleStore` |
| `PATCH /sales/:id` | Update sale | `UpdateSaleBody` | `Sale` | Invalidate `["sales"]` | `useSaleStore` |
| `PATCH /sales/:id/refund` | Refund sale | - | `Sale` | Invalidate `["sales", "products"]` | `useSaleStore` |
| `DELETE /sales/:id` | Delete sale | - | `null` | Invalidate `["sales", "products"]` | `useSaleStore` |

---

### Expense

| Endpoint | Purpose | Request | Response | React Query Key | Zustand Store |
|---|---|---|---|---|---|
| `GET /expenses` | List expenses | `?page=&limit=&search=&category=&paymentMethod=&startDate=&endDate=&sortBy=&sortOrder=` | `PaginatedResponse<Expense>` | `["expenses", { page, filters }]` | `useExpenseStore` |
| `GET /expenses/statistics` | Expense stats | `?startDate=&endDate=` | `ExpenseStatistics` | `["expenses", "statistics"]` | `useExpenseStore` |
| `GET /expenses/:id` | Get expense | - | `Expense` | `["expense", id]` | `useExpenseStore` |
| `POST /expenses` | Create expense | `CreateExpenseBody` | `Expense` | Invalidate `["expenses"]` | `useExpenseStore` |
| `PATCH /expenses/:id` | Update expense | `UpdateExpenseBody` | `Expense` | Invalidate `["expenses"]` | `useExpenseStore` |
| `DELETE /expenses/:id` | Delete expense | - | `null` | Invalidate `["expenses"]` | `useExpenseStore` |

---

### Dashboard

| Endpoint | Purpose | Request | Response | React Query Key | Zustand Store |
|---|---|---|---|---|---|
| `GET /dashboard/overview` | Full overview | - | `OverviewData` | `["dashboard", "overview"]` | `useDashboardStore` |
| `GET /dashboard/revenue` | Revenue data | - | `RevenueData` | `["dashboard", "revenue"]` | `useDashboardStore` |
| `GET /dashboard/sales` | Sales data | - | `SalesData` | `["dashboard", "sales"]` | `useDashboardStore` |
| `GET /dashboard/inventory` | Inventory data | - | `InventoryData` | `["dashboard", "inventory"]` | `useDashboardStore` |
| `GET /dashboard/charts` | Chart data | - | `ChartData` | `["dashboard", "charts"]` | `useDashboardStore` |
| `GET /dashboard/top-products` | Top products | `?limit=` | `TopProductsData` | `["dashboard", "top-products"]` | `useDashboardStore` |
| `GET /dashboard/warnings` | Warnings | - | `WarningsData` | `["dashboard", "warnings"]` | `useDashboardStore` |

---

### Settings

| Endpoint | Purpose | Request | Response | React Query Key | Zustand Store |
|---|---|---|---|---|---|
| `GET /settings/profile` | Get settings | - | `Settings` | `["settings"]` | `useSettingsStore` |
| `PATCH /settings/profile` | Update settings | `UpdateSettingsBody` | `Settings` | Invalidate `["settings", "shops"]` | `useSettingsStore` |

---

### AI Knowledge

| Endpoint | Purpose | Request | Response | React Query Key | Zustand Store |
|---|---|---|---|---|---|
| `GET /ai/knowledge` | List documents | `?page=&limit=&search=&fileType=&status=` | `PaginatedResponse<KnowledgeDocument>` | `["knowledge", { page }]` | `useKnowledgeStore` |
| `GET /ai/knowledge/:id` | Get document + chunks | - | `{ document, chunks }` | `["knowledge", id]` | `useKnowledgeStore` |
| `GET /ai/knowledge/:id/text` | Get extracted text | - | `{ document, extractedText }` | `["knowledge", id, "text"]` | `useKnowledgeStore` |
| `POST /ai/knowledge/upload` | Upload document | `FormData (file)` | `KnowledgeDocument` | Invalidate `["knowledge"]` | `useKnowledgeStore` |
| `PATCH /ai/knowledge/:id` | Rename document | `{ fileName }` | `KnowledgeDocument` | Invalidate `["knowledge"]` | `useKnowledgeStore` |
| `DELETE /ai/knowledge/:id` | Delete document | - | `null` | Invalidate `["knowledge"]` | `useKnowledgeStore` |
| `POST /ai/knowledge/chat` | Ask question | `{ question: string }` | `{ answer, sources }` | N/A (mutation) | `useKnowledgeStore` |
| `GET /ai/knowledge/chat/history` | Chat history | `?page=&limit=` | `PaginatedResponse<ChatHistory>` | `["knowledge", "chat-history"]` | `useKnowledgeStore` |

---

### Barcode

| Endpoint | Purpose | Request | Response | React Query Key | Zustand Store |
|---|---|---|---|---|---|
| `POST /barcodes/generate/:productId` | Auto-generate barcode | - | `{ productId, barcode }` | Invalidate `["products"]` | `useBarcodeStore` |
| `PATCH /barcodes/custom/:productId` | Set custom barcode | `{ barcode: string }` | `{ productId, barcode }` | Invalidate `["products"]` | `useBarcodeStore` |
| `GET /barcodes/svg?text=` | Get barcode SVG | Query: `text` | SVG image | N/A | - |
| `GET /barcodes/qr/:productId` | Get QR code | - | PNG image | N/A | - |
| `POST /barcodes/sheet` | Generate PDF barcode sheet | `{ productIds, labelsPerRow?, showPrice?, showName? }` | PDF blob | N/A | - |
| `POST /barcodes/qr-sheet` | Generate PDF QR sheet | `{ productIds, labelsPerRow?, showName?, showPrice? }` | PDF blob | N/A | - |

---

### Import/Export

| Endpoint | Purpose | Request | Response | React Query Key | Zustand Store |
|---|---|---|---|---|---|
| `POST /import-export/import/:entity` | Import data | `FormData (file)` | `ImportSummary` | Invalidate entity list | `useImportExportStore` |
| `GET /import-export/export/:entity?format=` | Export data | Query: `format` (csv/excel/pdf) | File download | N/A | - |

---

### Notifications

| Endpoint | Purpose | Request | Response | React Query Key | Zustand Store |
|---|---|---|---|---|---|
| `GET /notifications` | List notifications | `?page=&limit=` | `{ notifications, total, unreadCount }` | `["notifications"]` | `useNotificationStore` |
| `GET /notifications/unread-count` | Unread count | - | `{ count }` | `["notifications", "unread-count"]` | `useNotificationStore` |
| `PATCH /notifications/:id/read` | Mark read | - | `Notification` | Invalidate `["notifications"]` | `useNotificationStore` |
| `PATCH /notifications/read-all` | Mark all read | - | `{ modifiedCount }` | Invalidate `["notifications"]` | `useNotificationStore` |
| `DELETE /notifications/:id` | Delete | - | `null` | Invalidate `["notifications"]` | `useNotificationStore` |
| `DELETE /notifications` | Delete all | - | `{ modifiedCount }` | Invalidate `["notifications"]` | `useNotificationStore` |
| `POST /notifications/generate/inventory` | Generate alerts | - | `{ created }` | Invalidate `["notifications"]` | `useNotificationStore` |
| `POST /notifications/generate/sales-summary` | Sales summary | - | `Notification` | Invalidate `["notifications"]` | `useNotificationStore` |
| `POST /notifications/generate/profit-summary` | Profit summary | - | `Notification` | Invalidate `["notifications"]` | `useNotificationStore` |

---

### Reports

| Endpoint | Purpose | Request | Response | React Query Key | Zustand Store |
|---|---|---|---|---|---|
| `GET /reports/sales` | Sales report | `?dateRange=&startDate=&endDate=` | `SalesReportData` | `["reports", "sales", { dateRange }]` | `useReportStore` |
| `GET /reports/purchases` | Purchase report | `?dateRange=&startDate=&endDate=` | `PurchaseReportData` | `["reports", "purchases", { dateRange }]` | `useReportStore` |
| `GET /reports/inventory` | Inventory report | - | `InventoryReportData` | `["reports", "inventory"]` | `useReportStore` |
| `GET /reports/expenses` | Expense report | `?dateRange=&startDate=&endDate=` | `ExpenseReportData` | `["reports", "expenses", { dateRange }]` | `useReportStore` |
| `GET /reports/profit` | Profit report | `?dateRange=&startDate=&endDate=` | `ProfitReportData` | `["reports", "profit", { dateRange }]` | `useReportStore` |
| `GET /reports/revenue` | Revenue report | `?dateRange=&startDate=&endDate=` | `RevenueReportData` | `["reports", "revenue", { dateRange }]` | `useReportStore` |
| `GET /reports/export/:type` | Export report | `?format=&dateRange=&startDate=&endDate=` | File download | N/A | - |

---

## 17. Route Summary

| METHOD | URL | AUTH | MODULE | DESCRIPTION |
|---|---|---|---|---|
| `GET` | `/health` | No | System | Health check |
| `GET` | `/api/shops` | requireAuth | Shop | List shops |
| `GET` | `/api/shops/:id` | requireAuth | Shop | Get shop |
| `POST` | `/api/shops` | requireAuth + requireOwner | Shop | Create shop |
| `PUT` | `/api/shops/:id` | requireAuth + requireOwner | Shop | Update shop |
| `DELETE` | `/api/shops/:id` | requireAuth + requireOwner | Shop | Delete shop |
| `GET` | `/api/categories` | requireAuth + requireShopAccess | Category | List categories |
| `GET` | `/api/categories/:id` | requireAuth + requireShopAccess | Category | Get category |
| `POST` | `/api/categories` | requireAuth + requireShopAccess | Category | Create category |
| `PUT` | `/api/categories/:id` | requireAuth + requireShopAccess | Category | Update category |
| `DELETE` | `/api/categories/:id` | requireAuth + requireShopAccess | Category | Delete category |
| `GET` | `/api/suppliers` | requireAuth + requireShopAccess | Supplier | List suppliers |
| `GET` | `/api/suppliers/:id` | requireAuth + requireShopAccess | Supplier | Get supplier |
| `POST` | `/api/suppliers` | requireAuth + requireShopAccess | Supplier | Create supplier |
| `PATCH` | `/api/suppliers/:id` | requireAuth + requireShopAccess | Supplier | Update supplier |
| `DELETE` | `/api/suppliers/:id` | requireAuth + requireShopAccess | Supplier | Delete supplier |
| `GET` | `/api/products` | requireAuth + requireShopAccess | Product | List products |
| `GET` | `/api/products/statistics` | requireAuth + requireShopAccess | Product | Product statistics |
| `GET` | `/api/products/low-stock` | requireAuth + requireShopAccess | Product | Low stock products |
| `GET` | `/api/products/out-of-stock` | requireAuth + requireShopAccess | Product | Out of stock products |
| `GET` | `/api/products/:id` | requireAuth + requireShopAccess | Product | Get product |
| `POST` | `/api/products` | requireAuth + requireShopAccess | Product | Create product |
| `PATCH` | `/api/products/:id` | requireAuth + requireShopAccess | Product | Update product |
| `DELETE` | `/api/products/:id` | requireAuth + requireShopAccess | Product | Delete product |
| `PATCH` | `/api/products/:id/stock` | requireAuth + requireShopAccess | Product | Update stock |
| `GET` | `/api/purchases` | requireAuth + requireShopAccess | Purchase | List purchases |
| `GET` | `/api/purchases/statistics` | requireAuth + requireShopAccess | Purchase | Purchase statistics |
| `GET` | `/api/purchases/:id` | requireAuth + requireShopAccess | Purchase | Get purchase |
| `POST` | `/api/purchases` | requireAuth + requireShopAccess | Purchase | Create purchase |
| `PATCH` | `/api/purchases/:id` | requireAuth + requireShopAccess | Purchase | Update purchase |
| `DELETE` | `/api/purchases/:id` | requireAuth + requireShopAccess | Purchase | Delete purchase |
| `GET` | `/api/sales` | requireAuth + requireShopAccess | Sale | List sales |
| `GET` | `/api/sales/statistics` | requireAuth + requireShopAccess | Sale | Sale statistics |
| `GET` | `/api/sales/top-products` | requireAuth + requireShopAccess | Sale | Top products |
| `GET` | `/api/sales/:id` | requireAuth + requireShopAccess | Sale | Get sale |
| `POST` | `/api/sales` | requireAuth + requireShopAccess | Sale | Create sale |
| `PATCH` | `/api/sales/:id` | requireAuth + requireShopAccess | Sale | Update sale |
| `PATCH` | `/api/sales/:id/refund` | requireAuth + requireShopAccess | Sale | Refund sale |
| `DELETE` | `/api/sales/:id` | requireAuth + requireShopAccess | Sale | Delete sale |
| `GET` | `/api/expenses/statistics` | requireAuth + requireShopAccess | Expense | Expense statistics |
| `GET` | `/api/expenses` | requireAuth + requireShopAccess | Expense | List expenses |
| `GET` | `/api/expenses/:id` | requireAuth + requireShopAccess | Expense | Get expense |
| `POST` | `/api/expenses` | requireAuth + requireShopAccess | Expense | Create expense |
| `PATCH` | `/api/expenses/:id` | requireAuth + requireShopAccess | Expense | Update expense |
| `DELETE` | `/api/expenses/:id` | requireAuth + requireShopAccess | Expense | Delete expense |
| `GET` | `/api/dashboard/overview` | requireAuth + requireShopAccess | Dashboard | Dashboard overview |
| `GET` | `/api/dashboard/revenue` | requireAuth + requireShopAccess | Dashboard | Revenue data |
| `GET` | `/api/dashboard/sales` | requireAuth + requireShopAccess | Dashboard | Sales data |
| `GET` | `/api/dashboard/inventory` | requireAuth + requireShopAccess | Dashboard | Inventory data |
| `GET` | `/api/dashboard/charts` | requireAuth + requireShopAccess | Dashboard | Chart data |
| `GET` | `/api/dashboard/top-products` | requireAuth + requireShopAccess | Dashboard | Top products |
| `GET` | `/api/dashboard/warnings` | requireAuth + requireShopAccess | Dashboard | Warnings |
| `GET` | `/api/settings/profile` | requireAuth + requireShopAccess | Settings | Get settings |
| `PATCH` | `/api/settings/profile` | requireAuth + requireShopAccess | Settings | Update settings |
| `POST` | `/api/ai/knowledge/upload` | requireAuth + requireShopAccess | AI Knowledge | Upload document |
| `GET` | `/api/ai/knowledge` | requireAuth + requireShopAccess | AI Knowledge | List documents |
| `GET` | `/api/ai/knowledge/chat/history` | requireAuth + requireShopAccess | AI Knowledge | Chat history |
| `POST` | `/api/ai/knowledge/chat` | requireAuth + requireShopAccess | AI Knowledge | Ask question |
| `GET` | `/api/ai/knowledge/:id` | requireAuth + requireShopAccess | AI Knowledge | Get document |
| `GET` | `/api/ai/knowledge/:id/text` | requireAuth + requireShopAccess | AI Knowledge | Get extracted text |
| `PATCH` | `/api/ai/knowledge/:id` | requireAuth + requireShopAccess | AI Knowledge | Update document |
| `DELETE` | `/api/ai/knowledge/:id` | requireAuth + requireShopAccess | AI Knowledge | Delete document |
| `POST` | `/api/barcodes/generate/:productId` | requireAuth + requireShopAccess | Barcode | Generate barcode |
| `PATCH` | `/api/barcodes/custom/:productId` | requireAuth + requireShopAccess | Barcode | Set custom barcode |
| `GET` | `/api/barcodes/svg` | requireAuth + requireShopAccess | Barcode | Get barcode SVG |
| `GET` | `/api/barcodes/qr/:productId` | requireAuth + requireShopAccess | Barcode | Get QR code |
| `POST` | `/api/barcodes/sheet` | requireAuth + requireShopAccess | Barcode | Barcode PDF sheet |
| `POST` | `/api/barcodes/qr-sheet` | requireAuth + requireShopAccess | Barcode | QR PDF sheet |
| `POST` | `/api/import-export/import/:entity` | requireAuth + requireShopAccess | Import/Export | Import CSV/Excel |
| `GET` | `/api/import-export/export/:entity` | requireAuth + requireShopAccess | Import/Export | Export data |
| `GET` | `/api/notifications` | requireAuth + requireShopAccess | Notification | List notifications |
| `GET` | `/api/notifications/unread-count` | requireAuth + requireShopAccess | Notification | Unread count |
| `PATCH` | `/api/notifications/:id/read` | requireAuth + requireShopAccess | Notification | Mark as read |
| `PATCH` | `/api/notifications/read-all` | requireAuth + requireShopAccess | Notification | Mark all read |
| `DELETE` | `/api/notifications/:id` | requireAuth + requireShopAccess | Notification | Delete notification |
| `DELETE` | `/api/notifications` | requireAuth + requireShopAccess | Notification | Delete all |
| `POST` | `/api/notifications/generate/inventory` | requireAuth + requireShopAccess | Notification | Generate inventory alerts |
| `POST` | `/api/notifications/generate/sales-summary` | requireAuth + requireShopAccess | Notification | Generate sales summary |
| `POST` | `/api/notifications/generate/profit-summary` | requireAuth + requireShopAccess | Notification | Generate profit summary |
| `GET` | `/api/reports/sales` | requireAuth + requireShopAccess | Report | Sales report |
| `GET` | `/api/reports/purchases` | requireAuth + requireShopAccess | Report | Purchase report |
| `GET` | `/api/reports/inventory` | requireAuth + requireShopAccess | Report | Inventory report |
| `GET` | `/api/reports/expenses` | requireAuth + requireShopAccess | Report | Expense report |
| `GET` | `/api/reports/profit` | requireAuth + requireShopAccess | Report | Profit report |
| `GET` | `/api/reports/revenue` | requireAuth + requireShopAccess | Report | Revenue report |
| `GET` | `/api/reports/export/:type` | requireAuth + requireShopAccess | Report | Export report |

**Total: 78 endpoints** (1 public + 77 authenticated)

---

## 18. Deployment

### Build

```bash
npm run build    # Runs tsc, outputs to ./dist
```

### Start

```bash
npm start        # Runs node dist/server.js
```

### Development

```bash
npm run dev      # Runs nodemon + tsx, watches src/ for changes
```

### Clean

```bash
npm run clean    # Removes ./dist directory
```

### Production Environment Variables

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/<db>?retryWrites=true&w=majority
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>
GEMINI_API_KEY=<gemini_api_key>
BETTER_AUTH_URL=https://your-frontend-domain.com
```

### Deployment Notes

- **TypeScript compilation**: `tsc` compiles `src/` to `dist/` targeting ES2022 with Node16 module resolution.
- **Module system**: CommonJS (`"type": "commonjs"` in package.json).
- **Health check endpoint**: `GET /health` (no auth required).
- **Graceful shutdown**: Handles `SIGTERM` and `SIGINT` signals.
- **Uncaught exceptions**: Logged and process exits with code 1.
- **Unhandled rejections**: Logged and process exits with code 1.
- **No Docker configuration** present in the repository.
- **No CI/CD configuration** present in the repository.
- **Rate limiter**: Applied to all `/api` routes (100 req/15 min). In production behind a reverse proxy, consider using `trust proxy` setting.
- **CORS origin**: Must match the `BETTER_AUTH_URL`. Update for production domain.
- **MongoDB Atlas**: Connection string should include proper auth and replica set config for production.
- **File uploads**: Using memory storage (multer). For high-traffic production, consider streaming to disk or direct-to-Cloudinary upload on the frontend.
