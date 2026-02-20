import { useState } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { useProducts, useDeleteProduct } from "@/hooks/use-products";
import { ProductDialog } from "@/components/product-dialog";
import { CurrencyDisplay } from "@/components/currency-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  Package 
} from "lucide-react";
import { type Product } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function Inventory() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialLowStock = searchParams.get('lowStock') === 'true';

  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const { data: products, isLoading } = useProducts({ 
    search, 
    lowStock: initialLowStock ? true : undefined 
  });
  
  const deleteMutation = useDeleteProduct();

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Inventory</h1>
            <p className="text-muted-foreground mt-1">Manage your stock, pricing, and items.</p>
          </div>
          <Button onClick={handleAdd} size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-5 w-5" /> Add New Item
          </Button>
        </div>

        <div className="flex items-center gap-4 bg-card p-2 rounded-xl shadow-sm border max-w-md">
          <Search className="h-5 w-5 text-muted-foreground ml-2" />
          <Input 
            placeholder="Search by name, SKU..." 
            className="border-none shadow-none focus-visible:ring-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">Loading inventory...</TableCell>
                </TableRow>
              ) : products?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="h-8 w-8 text-muted-foreground/50" />
                      <p>No products found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products?.map((product) => (
                  <TableRow key={product.id} className="group hover:bg-muted/20">
                    <TableCell className="font-medium">
                      <div>
                        {product.name}
                        {product.stockQuantity <= product.minStockLevel && (
                          <Badge variant="destructive" className="ml-2 text-[10px] h-5 px-1.5">
                            Low Stock
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{product.sku}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal bg-secondary/10 text-secondary-foreground hover:bg-secondary/20">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <CurrencyDisplay amount={product.price} className="font-semibold" />
                      <span className="text-xs text-muted-foreground ml-1">/ {product.unit}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`${product.stockQuantity <= product.minStockLevel ? 'text-destructive font-bold' : ''}`}>
                          {product.stockQuantity}
                        </span>
                        {product.stockQuantity <= product.minStockLevel && (
                           <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(product)}>
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:border-destructive/30" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ProductDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        product={editingProduct}
      />
    </LayoutShell>
  );
}
