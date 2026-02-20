import { useDashboardSummary } from "@/hooks/use-dashboard";
import { LayoutShell } from "@/components/layout-shell";
import { StatCard } from "@/components/stat-card";
import { AlertCircle, IndianRupee, TrendingUp, AlertTriangle } from "lucide-react";
import { CurrencyDisplay } from "@/components/currency-display";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data, isLoading, error } = useDashboardSummary();

  if (isLoading) {
    return (
      <LayoutShell>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </LayoutShell>
    );
  }

  if (error || !data) {
    return (
      <LayoutShell>
        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold">Failed to load dashboard</h2>
          <p className="text-muted-foreground mt-2">Could not connect to the server. Please try again.</p>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back to your shop overview.</p>
          </div>
          <Link href="/billing">
            <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <IndianRupee className="mr-2 h-5 w-5" />
              New Sale (Bill)
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Today's Sales"
            value={<CurrencyDisplay amount={data.todaySales} />}
            icon={TrendingUp}
            color="primary"
            description="Total revenue today"
          />
          <StatCard
            title="Total Receivables (Udhar)"
            value={<CurrencyDisplay amount={data.totalReceivables} />}
            icon={IndianRupee}
            color="secondary"
            description="Amount to collect from customers"
          />
          <StatCard
            title="Low Stock Items"
            value={data.totalLowStock}
            icon={AlertTriangle}
            color="accent"
            description="Products below minimum level"
          />
          <StatCard
            title="Monthly Sales"
            value={<CurrencyDisplay amount={data.thisMonthSales} />}
            icon={TrendingUp}
            color="primary"
            description="Revenue this month"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions Card */}
          <div className="bg-card rounded-2xl border p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/inventory">
                <div className="group p-4 rounded-xl border bg-muted/30 hover:bg-primary/5 hover:border-primary/30 cursor-pointer transition-all">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <span className="text-xl font-bold text-primary">+</span>
                  </div>
                  <h4 className="font-semibold">Add Stock</h4>
                  <p className="text-xs text-muted-foreground mt-1">Update inventory items</p>
                </div>
              </Link>
              <Link href="/customers">
                <div className="group p-4 rounded-xl border bg-muted/30 hover:bg-secondary/5 hover:border-secondary/30 cursor-pointer transition-all">
                  <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <IndianRupee className="h-5 w-5 text-secondary" />
                  </div>
                  <h4 className="font-semibold">Record Payment</h4>
                  <p className="text-xs text-muted-foreground mt-1">Clear customer udhar</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Simple Alert Section */}
          <div className="bg-card rounded-2xl border p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Stock Alerts</h3>
            {data.totalLowStock > 0 ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/10 border border-accent/20">
                  <AlertTriangle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-accent-foreground">Attention Needed</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      You have {data.totalLowStock} items running low on stock. Check inventory to restock.
                    </p>
                    <Link href="/inventory?lowStock=true">
                      <Button variant="link" className="px-0 text-accent h-auto mt-2">
                        View Low Stock Items &rarr;
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm font-medium">All stocked up!</p>
                <p className="text-xs text-muted-foreground">No inventory alerts at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}
