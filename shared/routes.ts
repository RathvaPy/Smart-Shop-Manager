import { z } from 'zod';
import { 
  insertProductSchema, 
  insertCustomerSchema, 
  createBillSchema, 
  recordPaymentSchema,
  products,
  customers,
  transactions
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  dashboard: {
    summary: {
      method: 'GET' as const,
      path: '/api/dashboard/summary' as const,
      responses: {
        200: z.object({
          totalLowStock: z.number(),
          totalReceivables: z.number(),
          todaySales: z.number(),
          thisMonthSales: z.number()
        })
      }
    }
  },
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products' as const,
      input: z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        lowStock: z.string().optional() // 'true' or 'false'
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:id' as const,
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/products' as const,
      input: insertProductSchema,
      responses: {
        201: z.custom<typeof products.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/products/:id' as const,
      input: insertProductSchema.partial(),
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/products/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  },
  customers: {
    list: {
      method: 'GET' as const,
      path: '/api/customers' as const,
      input: z.object({
        search: z.string().optional(),
        hasCredit: z.string().optional() // 'true' or 'false'
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof customers.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/customers/:id' as const,
      responses: {
        200: z.custom<typeof customers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/customers' as const,
      input: insertCustomerSchema,
      responses: {
        201: z.custom<typeof customers.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/customers/:id' as const,
      input: insertCustomerSchema.partial(),
      responses: {
        200: z.custom<typeof customers.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    }
  },
  billing: {
    create: {
      method: 'POST' as const,
      path: '/api/billing/create' as const,
      input: createBillSchema,
      responses: {
        201: z.custom<typeof transactions.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    recordPayment: {
      method: 'POST' as const,
      path: '/api/billing/payment' as const,
      input: recordPaymentSchema,
      responses: {
        200: z.custom<typeof transactions.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    history: {
      method: 'GET' as const,
      path: '/api/billing/history' as const,
      input: z.object({
        customerId: z.string().optional(),
        limit: z.string().optional()
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof transactions.$inferSelect>()),
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type ProductInput = z.infer<typeof api.products.create.input>;
export type CustomerInput = z.infer<typeof api.customers.create.input>;
export type BillInput = z.infer<typeof api.billing.create.input>;
export type PaymentInput = z.infer<typeof api.billing.recordPayment.input>;
