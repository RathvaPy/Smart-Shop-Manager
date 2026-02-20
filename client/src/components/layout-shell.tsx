import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Menu, 
  Store 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Billing / POS", icon: ShoppingCart, href: "/billing" },
  { label: "Inventory", icon: Package, href: "/inventory" },
  { label: "Customers (Udhar)", icon: Users, href: "/customers" },
];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b flex items-center gap-3">
        <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
          <Store className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg leading-tight">Vyapar</h1>
          <p className="text-xs text-muted-foreground font-medium">Smart Manager</p>
        </div>
      </div>
      <div className="flex-1 py-6 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="block">
              <div
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200
                  ${isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 translate-x-1" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                `}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t bg-muted/20">
        <div className="text-xs text-center text-muted-foreground">
          &copy; {new Date().getFullYear()} Smart Local Business
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r bg-card fixed inset-y-0 z-50">
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden border-b bg-card p-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2">
             <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Store className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold font-display">Vyapar</span>
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <NavContent />
            </SheetContent>
          </Sheet>
        </header>

        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
