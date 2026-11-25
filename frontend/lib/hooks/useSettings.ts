import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore, AuthUser } from "@/lib/store/authStore";

export interface UserProfileData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone?: string | null;
  address?: string | null;
  bar_council_no?: string | null;
  avatar_url?: string | null;
  signature_url?: string | null;
  seal_url?: string | null;
  preferred_language?: string;
  preferences?: Record<string, any>;
  firm_id?: string | null;
  firm_name?: string | null;
  subdomain?: string | null;
  custom_domain?: string | null;
  domain?: string | null;
}

export interface UserProfileUpdatePayload {
  full_name?: string;
  phone?: string;
  bar_council_no?: string;
  address?: string;
  preferred_language?: string;
  avatar_url?: string;
  signature_url?: string;
  seal_url?: string;
  preferences?: Record<string, any>;
}

export interface EFilingPortalConfig {
  username: string;
  configured: boolean;
}

export interface FirmSettingsData {
  drafts: {
    default_language: string;
    preferred_categories: string[];
  };
  notifications: {
    alerts: {
      expiry: boolean;
      hearing: boolean;
      deadline: boolean;
      payment: boolean;
      team: boolean;
    };
    channels: {
      email: boolean;
      sms: boolean;
      whatsapp: boolean;
      inapp: boolean;
    };
  };
  billing: {
    default_gst_rate: string;
    invoice_prefix: string;
    payment_terms: string;
    upi_qr_data: string;
  };
  efiling: {
    state: string;
    district: string;
    portals: {
      ecourts: EFilingPortalConfig;
      hc_efiling: EFilingPortalConfig;
      consumer: EFilingPortalConfig;
      mact: EFilingPortalConfig;
    };
  };
  integrations: {
    whatsapp_enabled: boolean;
    whatsapp_phone_id: string;
    has_whatsapp_token: boolean;
    whatsapp_api_token?: string;
  };
  role_permissions: Record<string, string[]>;
  branding_assets: {
    dashboard_logo: string;
    login_branding: string;
    invoice_accent: string;
    portal_banner: string;
  };
}

export function useUserProfile() {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data } = await api.get<UserProfileData>("/users/me");
      return data;
    },
  });
}

export function useUpdateUserProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UserProfileUpdatePayload) => {
      const { data } = await api.patch<UserProfileData>("/users/me", payload);
      return data;
    },
    onSuccess: (updated) => {
      const existingUser = useAuthStore.getState().user;
      if (existingUser) {
        const merged: AuthUser = {
          ...existingUser,
          ...updated,
          phone: updated.phone ?? undefined,
          address: updated.address ?? undefined,
          bar_council_no: updated.bar_council_no ?? undefined,
        };
        useAuthStore.getState().setUser(merged);
      }
      qc.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}

export function useFirmSettings() {
  return useQuery({
    queryKey: ["firm-settings"],
    queryFn: async () => {
      const { data } = await api.get<FirmSettingsData>("/users/me/firm/settings");
      return data;
    },
  });
}

export function useUpdateFirmSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<FirmSettingsData>) => {
      const { data } = await api.patch<FirmSettingsData>("/users/me/firm/settings", payload);
      return data;
    },
    onSuccess: (updated) => {
      qc.setQueryData(["firm-settings"], updated);
      qc.invalidateQueries({ queryKey: ["firm-settings"] });
    },
  });
}
