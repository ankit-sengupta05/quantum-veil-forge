import { supabase } from "@/integrations/supabase/client";

// Helper to invoke edge functions
async function invoke<T = any>(
  functionName: string,
  action: string,
  options?: { body?: any; params?: Record<string, string> }
): Promise<T> {
  const params = new URLSearchParams({ action, ...options?.params });
  const { data, error } = await supabase.functions.invoke(
    `${functionName}?${params.toString()}`,
    {
      body: options?.body,
      method: options?.body ? "POST" : "GET",
    }
  );
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as T;
}

// =============================================
// MODULE 1: USER MANAGEMENT
// =============================================
export const userManagement = {
  getProfile: () => invoke("user-management", "get-profile"),
  updateProfile: (data: { display_name?: string; username?: string; avatar_url?: string }) =>
    invoke("user-management", "update-profile", { body: data }),
  changePassword: (new_password: string) =>
    invoke("user-management", "change-password", { body: { new_password } }),
  deleteAccount: () => invoke("user-management", "delete-account"),
  getRoles: () => invoke("user-management", "get-roles"),
  manageRoles: (target_user_id: string, role: string, operation: "add" | "remove") =>
    invoke("user-management", "manage-roles", { body: { target_user_id, role, operation } }),
  viewUser: (target_user_id?: string) =>
    invoke("user-management", "view-user", { params: target_user_id ? { target_user_id } : {} }),
};

// =============================================
// MODULE 2: FILE/ASSET MANAGEMENT
// =============================================
export const fileManagement = {
  add: (data: {
    title: string; description?: string; file_type?: string;
    encryption_method?: string; original_file_url?: string;
    encrypted_file_url?: string; file_size_bytes?: number;
    category?: string; tags?: string[]; is_public?: boolean; metadata?: any;
  }) => invoke("file-management", "add", { body: data }),
  edit: (id: string, updates: Record<string, any>) =>
    invoke("file-management", "edit", { body: { id, ...updates } }),
  delete: (id: string) => invoke("file-management", "delete", { body: { id } }),
  list: (page = 1, limit = 20) =>
    invoke("file-management", "list", { params: { page: String(page), limit: String(limit) } }),
  search: (q: string, category?: string) =>
    invoke("file-management", "search", { params: { q, ...(category ? { category } : {}) } }),
  categories: () => invoke("file-management", "categories"),
  review: (file_id: string, rating: number, comment?: string) =>
    invoke("file-management", "review", { body: { file_id, rating, comment } }),
  getReviews: (file_id: string) =>
    invoke("file-management", "get-reviews", { params: { file_id } }),
};

// =============================================
// MODULE 3: OPERATIONS MANAGEMENT
// =============================================
export const operationsManagement = {
  create: (data: {
    operation_type: "encode" | "decode"; encryption_method?: string;
    input_file_url?: string; message_embedded?: string;
    file_id?: string; metadata?: any;
  }) => invoke("operations", "create", { body: data }),
  cancel: (id: string) => invoke("operations", "cancel", { body: { id } }),
  track: (id: string) => invoke("operations", "track", { params: { id } }),
  history: (page = 1, limit = 20, type?: string) =>
    invoke("operations", "history", { params: { page: String(page), limit: String(limit), ...(type ? { type } : {}) } }),
  complete: (id: string, data: { output_file_url?: string; processing_time_ms?: number; error_message?: string }) =>
    invoke("operations", "complete", { body: { id, ...data } }),
  notifications: () => invoke("operations", "notifications"),
  markRead: (id: string) => invoke("operations", "mark-read", { body: { id } }),
  markAllRead: () => invoke("operations", "mark-all-read", { body: {} }),
};

// =============================================
// MODULE 4: REPORTS & ANALYTICS
// =============================================
export const reportsAnalytics = {
  activityLog: (limit = 50, type?: string) =>
    invoke("reports", "activity-log", { params: { limit: String(limit), ...(type ? { type } : {}) } }),
  logActivity: (activity_type: string, description?: string, metadata?: any) =>
    invoke("reports", "log-activity", { body: { activity_type, description, metadata } }),
  usageStats: (days = 30) =>
    invoke("reports", "usage-stats", { params: { days: String(days) } }),
  operationsSummary: (days = 30) =>
    invoke("reports", "operations-summary", { params: { days: String(days) } }),
  fileStats: () => invoke("reports", "file-stats"),
  dailyStats: (date?: string) =>
    invoke("reports", "daily-stats", { params: date ? { date } : {} }),
  monthlyStats: (year?: number, month?: number) =>
    invoke("reports", "monthly-stats", {
      params: { ...(year ? { year: String(year) } : {}), ...(month ? { month: String(month) } : {}) }
    }),
  exportReport: (format: "json" | "csv" = "json") =>
    invoke("reports", "export", { params: { format } }),
};
