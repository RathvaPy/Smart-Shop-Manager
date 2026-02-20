import { db } from "./db";
import { 
  products, 
  customers, 
  transactions, 
  transactionItems,
  type Product,
  type InsertProduct,
  type Customer,
  type InsertCustomer,
  type Transaction,
  type InsertTransaction,
  type TransactionItem,
  type InsertTransactionItem,
  type CreateBillRequest,
  type RecordPaymentRequest,
  type DashboardSummary
} from "@shared/schema";
import { eq, like, desc, sql, gte, and } from "drizzle-orm";

export interface IStorage {
  // Products
  getProducts(search?: string, category?: string, lowStock?: boolean): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;

  // Customers
  getCustomers(search?: string, hasCredit?: boolean): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, updates: Partial<InsertCustomer>): Promise<Customer | undefined>;

  // Billing & Transactions
  createBill(bill: CreateBillRequest): Promise<Transaction>;
  recordPayment(payment: RecordPaymentRequest): Promise<Transaction>;
  getTransactionHistory(customerId?: number, limit?: number): Promise<(Transaction & { items?: TransactionItem[], customer?: Customer })[]>;
  
  // Dashboard
  getDashboardSummary(): Promise<DashboardSummary>;
}

export class DatabaseStorage implements IStorage {
  
  // === PRODUCTS ===
  
  async getProducts(search?: string, category?: string, lowStock?: boolean): Promise<Product[]> {
    let query = db.select().from(products);
    
    // We would build a dynamic WHERE clause here in a real production app, 
    // but for simplicity we will just return all and let the caller filter or 
    // implement basic conditions
    
    let result = await query.orderBy(products.name);
    
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(s) || (p.sku && p.sku.toLowerCase().includes(s)));
    }
    
    if (category) {
      result = result.filter(p => p.category === category);
    }
    
    if (lowStock) {
      result = result.filter(p => p.stockQuantity <= p.minStockLevel);
    }
    
    return result;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // === CUSTOMERS ===

  async getCustomers(search?: string, hasCredit?: boolean): Promise<Customer[]> {
    let result = await db.select().from(customers).orderBy(customers.name);
    
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(s) || (c.phone && c.phone.includes(s)));
    }
    
    if (hasCredit) {
      result = result.filter(c => c.creditBalance > 0);
    }
    
    return result;
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db.update(customers)
      .set(updates)
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }

  // === BILLING & TRANSACTIONS ===

  async createBill(bill: CreateBillRequest): Promise<Transaction> {
    // 1. Calculate total amount
    let totalAmount = 0;
    for (const item of bill.items) {
      totalAmount += item.quantity * item.unitPrice;
    }

    // 2. Handle Customer (Create walk-in if necessary, or use existing)
    let customerId = bill.customerId;
    if (!customerId && bill.customerName) {
      // Create a quick walk-in customer
      const newCust = await this.createCustomer({
        name: bill.customerName,
        phone: bill.customerPhone || null,
        address: null
      });
      customerId = newCust.id;
    }

    // 3. Handle Udhar (Credit) Logic
    let amountPaid = bill.amountPaid !== undefined ? bill.amountPaid : (bill.paymentMethod === 'credit' ? 0 : totalAmount);
    let creditAdded = totalAmount - amountPaid;
    
    // Start transaction (in a real app, use db.transaction. For SQLite/PG drizzle, we can do it sequentially here for simplicity)
    
    // 4. Create the main transaction record
    const [tx] = await db.insert(transactions).values({
      customerId: customerId || null,
      type: 'sale',
      amount: totalAmount,
      paymentMethod: bill.paymentMethod,
      notes: creditAdded > 0 ? `Credit added: ${creditAdded}` : 'Full payment',
    }).returning();

    // 5. Add Transaction Items and Update Stock
    for (const item of bill.items) {
      await db.insert(transactionItems).values({
        transactionId: tx.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.quantity * item.unitPrice
      });

      // Decrease stock
      const product = await this.getProduct(item.productId);
      if (product) {
        await this.updateProduct(product.id, {
          stockQuantity: product.stockQuantity - item.quantity
        });
      }
    }

    // 6. Update Customer Credit Balance if needed
    if (customerId && creditAdded > 0) {
      const customer = await this.getCustomer(customerId);
      if (customer) {
        await this.updateCustomer(customerId, {
          creditBalance: customer.creditBalance + creditAdded
        });
      }
    }

    return tx;
  }

  async recordPayment(payment: RecordPaymentRequest): Promise<Transaction> {
    const customer = await this.getCustomer(payment.customerId);
    if (!customer) throw new Error("Customer not found");

    // 1. Create payment transaction
    const [tx] = await db.insert(transactions).values({
      customerId: payment.customerId,
      type: 'payment',
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      notes: payment.notes || 'Payment received to clear Udhar',
    }).returning();

    // 2. Reduce Customer Udhar
    await this.updateCustomer(payment.customerId, {
      creditBalance: Math.max(0, customer.creditBalance - payment.amount)
    });

    return tx;
  }

  async getTransactionHistory(customerId?: number, limitResult: number = 50): Promise<(Transaction & { items?: TransactionItem[], customer?: Customer })[]> {
    let query = db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(limitResult);
    
    let txs = await query;
    if (customerId) {
      txs = txs.filter(t => t.customerId === customerId);
    }

    // For simplicity, we are fetching items and customers manually.
    // In a production app, we would use Drizzle's relational queries.
    const result = [];
    for (const tx of txs) {
      const items = await db.select().from(transactionItems).where(eq(transactionItems.transactionId, tx.id));
      let customer;
      if (tx.customerId) {
        [customer] = await db.select().from(customers).where(eq(customers.id, tx.customerId));
      }
      result.push({ ...tx, items, customer });
    }

    return result;
  }

  // === DASHBOARD ===

  async getDashboardSummary(): Promise<DashboardSummary> {
    // 1. Low stock count
    const allProducts = await db.select().from(products);
    const totalLowStock = allProducts.filter(p => p.stockQuantity <= p.minStockLevel).length;

    // 2. Total Receivables (Udhar)
    const allCustomers = await db.select().from(customers);
    const totalReceivables = allCustomers.reduce((sum, c) => sum + c.creditBalance, 0);

    // 3. Sales logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const recentTxs = await db.select().from(transactions).where(and(eq(transactions.type, 'sale'), gte(transactions.createdAt, firstDayOfMonth)));
    
    let todaySales = 0;
    let thisMonthSales = 0;

    for (const tx of recentTxs) {
      if (tx.createdAt) {
        const txDate = new Date(tx.createdAt);
        thisMonthSales += tx.amount;
        if (txDate >= today) {
          todaySales += tx.amount;
        }
      }
    }

    return {
      totalLowStock,
      totalReceivables,
      todaySales,
      thisMonthSales
    };
  }
}

export const storage = new DatabaseStorage();