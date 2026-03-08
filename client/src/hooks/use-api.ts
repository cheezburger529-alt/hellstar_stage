import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";
import { useStore } from "@/lib/store";

export function useStageData() {
  return useQuery({
    queryKey: [api.stage.get.path],
    queryFn: async () => {
      const res = await fetch(api.stage.get.path);
      if (!res.ok) throw new Error('Failed to fetch stage');
      const data = await res.json();
      return api.stage.get.responses[200].parse(data);
    },
  });
}

export function useJoinStage() {
  const { setCurrentUser } = useStore();
  
  return useMutation({
    mutationFn: async (username: string) => {
      const res = await fetch(api.auth.join.path, {
        method: api.auth.join.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to join');
      }
      return api.auth.join.responses[200].parse(await res.json());
    },
    onSuccess: (user) => {
      setCurrentUser(user);
      localStorage.setItem('stage_username', user.username);
    }
  });
}

export function useAdminLogin() {
  const { setIsAdmin } = useStore();
  
  return useMutation({
    mutationFn: async (password: string) => {
      const res = await fetch(api.auth.adminLogin.path, {
        method: api.auth.adminLogin.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error('Invalid password');
      return api.auth.adminLogin.responses[200].parse(await res.json());
    },
    onSuccess: () => setIsAdmin(true)
  });
}

export function useCreateStage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string, description: string }) => {
      const res = await fetch(api.stage.create.path, {
        method: api.stage.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create stage');
      return api.stage.create.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.stage.get.path] })
  });
}
