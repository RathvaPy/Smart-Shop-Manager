import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema, type Product } from "@shared/schema";
import { type ProductInput } from "@shared/routes";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-products";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";
import { z } from "zod";

// Extend schema to handle float input for price but convert to int for submission
const formSchema = insertProductSchema.extend({
  price: z.coerce.number().min(0, "Price must be positive"), // Input as float (Rupees)
  stockQuantity: z.coerce.number().int().min(0),
  minStockLevel: z.coerce.number().int().min(0),
});

type FormData = z.infer<typeof formSchema>;

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function ProductDialog({ open, onOpenChange, product }: ProductDialogProps) {
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      sku: "",
      category: "Kirana",
      price: 0,
      stockQuantity: 0,
      minStockLevel: 5,
      unit: "pcs",
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        ...product,
        sku: product.sku || "",
        price: product.price / 100, // Convert paise to Rupees for display
      });
    } else {
      form.reset({
        name: "",
        sku: "",
        category: "Kirana",
        price: 0,
        stockQuantity: 0,
        minStockLevel: 5,
        unit: "pcs",
      });
    }
  }, [product, form, open]);

  const onSubmit = async (data: FormData) => {
    const submissionData: ProductInput = {
      ...data,
      price: Math.round(data.price * 100), // Convert Rupees to paise
    };

    try {
      if (product) {
        await updateMutation.mutateAsync({ id: product.id, ...submissionData });
      } else {
        await createMutation.mutateAsync(submissionData);
      }
      onOpenChange(false);
    } catch (error) {
      // handled by mutation onError
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {product ? "Update product details and stock." : "Add a new item to your shop inventory."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Tata Salt 1kg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Kirana">Kirana</SelectItem>
                        <SelectItem value="Medical">Medical</SelectItem>
                        <SelectItem value="Stationery">Stationery</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                        <SelectItem value="kg">Kilogram (kg)</SelectItem>
                        <SelectItem value="gm">Gram (gm)</SelectItem>
                        <SelectItem value="ltr">Liter (ltr)</SelectItem>
                        <SelectItem value="pkt">Packet (pkt)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU / Barcode (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Scan or enter code" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Stock</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minStockLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min. Stock Alert</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="mr-2">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90">
                {isPending ? "Saving..." : (product ? "Update Product" : "Create Product")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
