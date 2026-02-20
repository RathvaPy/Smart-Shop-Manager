import { useState } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { useCustomers } from "@/hooks/use-customers";
import { CustomerDialog } from "@/components/customer-dialog";
import { CurrencyDisplay } from "@/components/currency-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  Phone, 
  MapPin, 
  User, 
  History,
  Banknote
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRecordPayment } from "@/hooks/use-billing";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Customers() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  
  const { data: customers, isLoading } = useCustomers({ search });
  const paymentMutation = useRecordPayment();

  const handlePaymentClick = (customer: any) => {
    setSelectedCustomer(customer);
    setPaymentAmount("");
    setPaymentDialogOpen(true);
  };

  const submitPayment = async () => {
    if (!selectedCustomer || !paymentAmount) return;
    
    try {
      await paymentMutation.mutateAsync({
        customerId: selectedCustomer.id,
        amount: Math.round(parseFloat(paymentAmount) * 100),
        paymentMethod: "cash", // default for simple flow
        notes: "Manual payment entry"
      });
      setPaymentDialogOpen(false);
    } catch (e) {
      // error handled by hook
    }
  };

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-muted-foreground mt-1">Manage Udhar (credit) and customer details.</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-5 w-5" /> Add Customer
          </Button>
        </div>

        <div className="flex items-center gap-4 bg-card p-2 rounded-xl shadow-sm border max-w-md">
          <Search className="h-5 w-5 text-muted-foreground ml-2" />
          <Input 
            placeholder="Search by name or phone..." 
            className="border-none shadow-none focus-visible:ring-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Credit Balance (Udhar)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">Loading customers...</TableCell>
                </TableRow>
              ) : customers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <User className="h-8 w-8 text-muted-foreground/50" />
                      <p>No customers found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                customers?.map((customer) => (
                  <TableRow key={customer.id} className="group hover:bg-muted/20">
                    <TableCell className="font-medium text-base">
                      {customer.name}
                    </TableCell>
                    <TableCell>
                      {customer.phone ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {customer.phone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                       {customer.address ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {customer.address}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.creditBalance > 0 ? (
                         <div className="flex items-center gap-2">
                           <CurrencyDisplay amount={customer.creditBalance} className="font-bold text-destructive" />
                           <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/5 text-[10px]">
                             Pending
                           </Badge>
                         </div>
                      ) : (
                        <span className="text-green-600 font-medium text-sm flex items-center gap-1">
                          Settled
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                       {customer.creditBalance > 0 && (
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="h-8"
                            onClick={() => handlePaymentClick(customer)}
                          >
                            <Banknote className="h-4 w-4 mr-1.5" />
                            Take Payment
                          </Button>
                       )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CustomerDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Accept payment from {selectedCustomer?.name} to clear their Udhar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg flex justify-between items-center border">
               <span className="text-sm font-medium text-muted-foreground">Current Balance</span>
               <CurrencyDisplay amount={selectedCustomer?.creditBalance || 0} className="font-bold text-lg text-destructive" />
            </div>
            
            <div className="space-y-2">
              <Label>Payment Amount (₹)</Label>
              <Input 
                type="number" 
                placeholder="Enter amount" 
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitPayment} disabled={paymentMutation.isPending || !paymentAmount}>
              {paymentMutation.isPending ? "Recording..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LayoutShell>
  );
}
