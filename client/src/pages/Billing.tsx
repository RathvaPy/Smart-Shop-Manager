import { useState, useMemo } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Trash2, 
  ShoppingCart, 
  Plus, 
  Minus, 
  UserPlus, 
  CreditCard,
  Banknote,
  QrCode
} from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { useCustomers, useCreateCustomer } from "@/hooks/use-customers";
import { useCreateBill } from "@/hooks/use-billing";
import { CurrencyDisplay } from "@/components/currency-display";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
};

export default function Billing() {
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("walk-in");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "credit">("cash");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [showCheckout, setShowCheckout] = useState(false);

  const { data: products } = useProducts({ search: searchTerm });
  const { data: customers } = useCustomers();
  const createBillMutation = useCreateBill();

  // Filter products for quick search
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => p.stockQuantity > 0);
  }, [products]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { 
        productId: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: 1,
        unit: product.unit 
      }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    const payload: any = {
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price
      })),
      paymentMethod,
    };

    if (selectedCustomerId !== "walk-in") {
      payload.customerId = parseInt(selectedCustomerId);
    } else {
      payload.customerName = "Walk-in Customer";
    }

    if (amountPaid) {
      payload.amountPaid = Math.round(parseFloat(amountPaid) * 100);
    }

    try {
      await createBillMutation.mutateAsync(payload);
      setCart([]);
      setShowCheckout(false);
      setAmountPaid("");
      setPaymentMethod("cash");
      setSelectedCustomerId("walk-in");
    } catch (e) {
      // error handled by hook
    }
  };

  return (
    <LayoutShell>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-6">
        {/* Left Side: Product Selection */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <div className="flex items-center gap-4 bg-card p-4 rounded-xl shadow-sm border">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              className="border-none shadow-none focus-visible:ring-0 text-lg h-auto p-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <ScrollArea className="flex-1 rounded-xl border bg-muted/20 p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-card hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200 p-4 rounded-xl border text-left group flex flex-col h-full"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{product.category}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <CurrencyDisplay amount={product.price} className="font-bold text-lg" />
                    <div className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground">
                      {product.unit}
                    </div>
                  </div>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <p>No products found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Side: Cart Summary */}
        <div className="w-full lg:w-96 flex flex-col gap-4 min-h-0">
          <Card className="flex-1 flex flex-col shadow-xl border-t-4 border-t-primary">
            <div className="p-4 border-b bg-muted/10">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Current Order
              </h2>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-2">
                  <ShoppingCart className="h-12 w-12" />
                  <p>Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.productId} className="flex items-center justify-between gap-3 bg-muted/20 p-2 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate text-sm">{item.name}</h4>
                        <div className="text-xs text-muted-foreground">
                          <CurrencyDisplay amount={item.price} /> / {item.unit}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-background rounded-md border px-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 rounded-sm"
                          onClick={() => updateQuantity(item.productId, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-4 text-center text-sm font-medium">{item.quantity}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 rounded-sm"
                          onClick={() => updateQuantity(item.productId, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="text-right min-w-[60px]">
                        <div className="font-bold text-sm">
                          <CurrencyDisplay amount={item.price * item.quantity} />
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.productId)}
                          className="text-xs text-destructive hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t bg-muted/10 space-y-4">
              <div className="flex items-center justify-between text-2xl font-bold">
                <span>Total</span>
                <CurrencyDisplay amount={totalAmount} />
              </div>

              <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20" 
                    disabled={cart.length === 0}
                  >
                    Proceed to Pay
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Complete Transaction</DialogTitle>
                    <DialogDescription>Select customer and payment method</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Customer</Label>
                      <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                          {customers?.map(c => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name} {c.phone ? `(${c.phone})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={paymentMethod === "cash" ? "default" : "outline"}
                        onClick={() => setPaymentMethod("cash")}
                        className="flex flex-col items-center h-20 gap-1"
                        type="button"
                      >
                        <Banknote className="h-6 w-6" />
                        Cash
                      </Button>
                      <Button
                        variant={paymentMethod === "upi" ? "default" : "outline"}
                        onClick={() => setPaymentMethod("upi")}
                        className="flex flex-col items-center h-20 gap-1"
                        type="button"
                      >
                        <QrCode className="h-6 w-6" />
                        UPI
                      </Button>
                      <Button
                        variant={paymentMethod === "credit" ? "default" : "outline"}
                        onClick={() => setPaymentMethod("credit")}
                        disabled={selectedCustomerId === "walk-in"}
                        className="flex flex-col items-center h-20 gap-1"
                        type="button"
                      >
                        <CreditCard className="h-6 w-6" />
                        Credit (Udhar)
                      </Button>
                    </div>
                    {selectedCustomerId === "walk-in" && paymentMethod === "credit" && (
                       <p className="text-xs text-destructive text-center">
                         Select a customer to use Credit
                       </p>
                    )}

                    {paymentMethod === "credit" && (
                      <div className="space-y-2">
                         <Label>Partial Payment (Optional)</Label>
                         <Input 
                           type="number" 
                           placeholder="Enter amount paid now"
                           value={amountPaid}
                           onChange={(e) => setAmountPaid(e.target.value)}
                         />
                         <p className="text-xs text-muted-foreground">
                           Remaining balance will be added to customer's Udhar.
                         </p>
                      </div>
                    )}
                    
                    <div className="bg-muted p-4 rounded-lg flex justify-between items-center mt-4">
                        <span className="font-semibold">Total Amount</span>
                        <CurrencyDisplay amount={totalAmount} className="text-xl font-bold text-primary" />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button onClick={handleCheckout} disabled={createBillMutation.isPending} className="w-full">
                      {createBillMutation.isPending ? "Processing..." : "Confirm & Print Bill"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        </div>
      </div>
    </LayoutShell>
  );
}
