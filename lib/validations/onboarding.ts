import { z } from "zod";

export const workspaceRoleOptions = [
  "Product Manager",
  "Head of Product",
  "VP Product",
  "Founder",
  "Other",
] as const;

export const workspaceSetupSchema = z
  .object({
    workspaceName: z
      .string()
      .trim()
      .min(2, "Workspace name must be at least 2 characters.")
      .max(50, "Workspace name must be 50 characters or less."),
    role: z.enum(workspaceRoleOptions, {
      error: "Select your role.",
    }),
  })
  .strict();

export type WorkspaceSetupInput = z.infer<typeof workspaceSetupSchema>;

export const companyUserRangeOptions = [
  "Less than 100",
  "100 to 500",
  "500 to 1,000",
  "1,000 to 5,000",
  "More than 5,000",
] as const;

export const companyMrrOptions = [
  "Pre-revenue",
  "$0 to $10k",
  "$10k to $50k",
  "$50k to $200k",
  "$200k+",
] as const;

export const companyProductTypeOptions = [
  "B2B SaaS",
  "B2C SaaS",
  "Marketplace",
  "Developer Tools",
  "Other",
] as const;

export const companyDetailsSchema = z
  .object({
    totalUsersRange: z.enum(companyUserRangeOptions, {
      error: "Select your total active users range.",
    }),
    mrrRange: z.enum(companyMrrOptions, {
      error: "Select your monthly revenue range.",
    }),
    productType: z.enum(companyProductTypeOptions, {
      error: "Select your product type.",
    }),
  })
  .strict();

export type CompanyDetailsInput = z.infer<typeof companyDetailsSchema>;
