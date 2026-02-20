import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku"),
  category: text("category").notNull(), // Kirana, Medical, Stationery
  price: integer("price").notNull(), // Stored in paise/cents to avoid floating point issues
  stockQuantity: integer("stock_quantity").notNull().default(0),
  minStockLevel: integer("min_stock_level").notNull().default(5),
  unit: text("unit").notNull().default("pcs"), // kg, gm, ltr, ml, pcs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  creditBalance: integer("credit_balance").notNull().default(0), // Total amount they owe (Udhar)
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  type: text("type").notNull(), // 'sale', 'payment', 'credit_added'
  amount: integer("amount").notNull(),
  paymentMethod: text("payment_method").notNull().default("cash"), // cash, upi, credit
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactionItems = pgTable("transaction_items", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").notNull().references(() => transactions.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  subtotal: integer("subtotal").notNull(),
});

// === RELATIONS ===

export const customersRelations = relations(customers, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  customer: one(customers, {
    fields: [transactions.customerId],
    references: [customers.id],
  }),
  items: many(transactionItems),
}));

export const transactionItemsRelations = relations(transactionItems, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionItems.transactionId],
    references: [transactions.id],
  }),
  product: one(products, {
    fields: [transactionItems.productId],
    references: [products.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, creditBalance: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertTransactionItemSchema = createInsertSchema(transactionItems).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type TransactionItem = typeof transactionItems.$inferSelect;
export type InsertTransactionItem = z.infer<typeof insertTransactionItemSchema>;

// Request Types
export type CreateProductRequest = InsertProduct;
export type UpdateProductRequest = Partial<InsertProduct>;

export type CreateCustomerRequest = InsertCustomer;
export type UpdateCustomerRequest = Partial<InsertCustomer>;

// Complex billing request
export const createBillSchema = z.object({
  customerId: z.number().optional(),
  customerName: z.string().optional(), // For walk-in
  customerPhone: z.string().optional(), // For walk-in
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number(),
    unitPrice: z.number(),
  })).min(1),
  paymentMethod: z.enum(["cash", "upi", "credit"]),
  amountPaid: z.number().optional(), // Used if partially paid and rest goes to udhar
});

export type CreateBillRequest = z.infer<typeof createBillSchema>;

export const recordPaymentSchema = z.object({
  customerId: z.number(),
  amount: z.number(),
  paymentMethod: z.enum(["cash", "upi"]),
  notes: z.string().optional(),
});
export type RecordPaymentRequest = z.infer<typeof recordPaymentSchema>;

// Response Types
export type ProductResponse = Product;
export type CustomerResponse = Customer;
export type TransactionResponse = Transaction & { 
  items?: TransactionItem[], 
  customer?: Customer 
};

// Summary stats
export type DashboardSummary = {
  totalLowStock: number;
  totalReceivables: number; // Total Udhar
  todaySales: number;
  thisMonthSales: number;
};
