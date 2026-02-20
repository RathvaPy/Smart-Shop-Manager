import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CustomerInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useCustomers(filters?: { search?: string; hasCredit?: boolean }) {
  const queryParams = new URLSearchParams();
  if (filters?.search) queryParams.append("search", filters.search);
  if (filters?.hasCredit) queryParams.append("hasCredit", "true");

  const url = `${api.customers.list.path}?${queryParams.toString()}`;

  return useQuery({
    queryKey: [api.customers.list.path, filters],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch customers");
      return api.customers.list.responses[200].parse(await res.json());
    },
  });
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: [api.customers.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.customers.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch customer");
      return api.customers.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CustomerInput) => {
      const res = await fetch(api.customers.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create customer");
      }
      return api.customers.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.customers.list.path] });
      toast({
        title: "Success",
        description: "Customer added successfully",
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
