import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api, type BillInput, type PaymentInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useCreateBill() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: BillInput) => {
      const res = await fetch(api.billing.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to process bill");
      }
      return api.billing.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.customers.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.summary.path] });
      toast({
        title: "Bill Created",
        description: "Transaction completed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Transaction Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: PaymentInput) => {
      const res = await fetch(api.billing.recordPayment.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to record payment");
      }
      return api.billing.recordPayment.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.customers.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.summary.path] });
      toast({
        title: "Payment Recorded",
        description: "Customer credit updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useBillingHistory(customerId?: string) {
  return useQuery({
    queryKey: [api.billing.history.path, customerId],
    queryFn: async () => {
      let url = api.billing.history.path;
      if (customerId) url += `?customerId=${customerId}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch billing history");
      return api.billing.history.responses[200].parse(await res.json());
    },
  });
}
