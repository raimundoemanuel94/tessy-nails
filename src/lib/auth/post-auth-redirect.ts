export type PostAuthProfile = {
  role?: string | null;
  studio_id?: string | null;
} | null | undefined;

export function getPostAuthRedirectPath(profile: PostAuthProfile): string {
  if (profile?.role === "superadmin") return "/admin";
  if (profile?.studio_id) return "/dashboard";
  return "/setup";
}
