import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // === DASHBOARD ===
  app.get(api.dashboard.summary.path, async (req, res) => {
    try {
      const summary = await storage.getDashboardSummary();
      res.json(summary);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === PRODUCTS ===
  app.get(api.products.list.path, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;
      const lowStock = req.query.lowStock === 'true';
      
      const products = await storage.getProducts(search, category, lowStock);
      res.json(products);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.products.get.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      
      const product = await storage.getProduct(id);
      if (!product) return res.status(404).json({ message: "Product not found" });
      
      res.json(product);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.products.create.path, async (req, res) => {
    try {
      // Coerce numeric values from strings if they came from form data
      const input = api.products.create.input.parse({
        ...req.body,
        price: Number(req.body.price),
        stockQuantity: Number(req.body.stockQuantity || 0),
        minStockLevel: Number(req.body.minStockLevel || 5)
      });
      
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.products.update.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const body = { ...req.body };
      if (body.price !== undefined) body.price = Number(body.price);
      if (body.stockQuantity !== undefined) body.stockQuantity = Number(body.stockQuantity);
      if (body.minStockLevel !== undefined) body.minStockLevel = Number(body.minStockLevel);

      const input = api.products.update.input.parse(body);
      const product = await storage.updateProduct(id, input);
      
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.products.delete.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      
      await storage.deleteProduct(id);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === CUSTOMERS ===
  app.get(api.customers.list.path, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const hasCredit = req.query.hasCredit === 'true';
      
      const customers = await storage.getCustomers(search, hasCredit);
      res.json(customers);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.customers.get.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      
      const customer = await storage.getCustomer(id);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      
      res.json(customer);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.customers.create.path, async (req, res) => {
    try {
      const input = api.customers.create.input.parse(req.body);
      const customer = await storage.createCustomer(input);
      res.status(201).json(customer);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.customers.update.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const input = api.customers.update.input.parse(req.body);
      const customer = await storage.updateCustomer(id, input);
      
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      res.json(customer);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === BILLING ===
  app.post(api.billing.create.path, async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.customerId) body.customerId = Number(body.customerId);
      if (body.amountPaid !== undefined) body.amountPaid = Number(body.amountPaid);
      
      if (body.items && Array.isArray(body.items)) {
        body.items = body.items.map((i: any) => ({
          ...i,
          productId: Number(i.productId),
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice)
        }));
      }

      const input = api.billing.create.input.parse(body);
      const transaction = await storage.createBill(input);
      res.status(201).json(transaction);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post(api.billing.recordPayment.path, async (req, res) => {
    try {
      const body = { ...req.body };
      body.customerId = Number(body.customerId);
      body.amount = Number(body.amount);

      const input = api.billing.recordPayment.input.parse(body);
      const transaction = await storage.recordPayment(input);
      res.json(transaction);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.billing.history.path, async (req, res) => {
    try {
      const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const history = await storage.getTransactionHistory(customerId, limit);
      res.json(history);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Seed data function to ensure app works out of the box
  seedDatabase().catch(console.error);

  return httpServer;
}

async function seedDatabase() {
  const existingProducts = await storage.getProducts();
  if (existingProducts.length === 0) {
    // 1. Seed some products
    await storage.createProduct({ name: "Aashirvaad Atta (5kg)", sku: "ATA-001", category: "Kirana", price: 23500, stockQuantity: 20, minStockLevel: 5, unit: "pcs" });
    await storage.createProduct({ name: "Tata Salt (1kg)", sku: "SLT-001", category: "Kirana", price: 2500, stockQuantity: 50, minStockLevel: 10, unit: "pcs" });
    await storage.createProduct({ name: "Paracetamol 500mg", sku: "MED-001", category: "Medical", price: 1500, stockQuantity: 100, minStockLevel: 20, unit: "pcs" });
    await storage.createProduct({ name: "Classmate Notebook", sku: "STN-001", category: "Stationery", price: 4500, stockQuantity: 30, minStockLevel: 10, unit: "pcs" });
    await storage.createProduct({ name: "Lux Soap (Set of 4)", sku: "SOAP-001", category: "Kirana", price: 11000, stockQuantity: 2, minStockLevel: 5, unit: "pcs" }); // Intentionally low stock
    
    // 2. Seed some customers
    const c1 = await storage.createCustomer({ name: "Rahul Sharma", phone: "9876543210", address: "Flat 101, Omkar Apt" });
    const c2 = await storage.createCustomer({ name: "Priya Patel", phone: "9876543211", address: "Bungalow 5, Sunrise Society" });
    
    // 3. Seed initial transactions to give them credit balance and show history
    await storage.createBill({
      customerId: c1.id,
      items: [
        { productId: 1, quantity: 1, unitPrice: 23500 }, // Aashirvaad Atta
        { productId: 2, quantity: 2, unitPrice: 2500 },  // Tata Salt
      ],
      paymentMethod: "credit", // 285.00 Udhar
    });
    
    await storage.createBill({
      customerId: c2.id,
      items: [
        { productId: 3, quantity: 1, unitPrice: 1500 }, // Paracetamol
      ],
      paymentMethod: "upi", // Paid via UPI
    });
  }
}