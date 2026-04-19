"use server";

import { randomUUID } from "node:crypto";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  companyDetailsSchema,
  workspaceSetupSchema,
} from "@/lib/validations/onboarding";

export type OnboardingActionState = {
  errors?: {
    workspaceName?: string;
    role?: string;
    totalUsersRange?: string;
    mrrRange?: string;
    productType?: string;
    file?: string;
    form?: string;
  };
  toast?: string;
};

const MAX_SLUG_LENGTH = 60;
const USER_RANGE_TO_ESTIMATE: Record<string, number> = {
  "Less than 100": 50,
  "100 to 500": 250,
  "500 to 1,000": 750,
  "1,000 to 5,000": 2500,
  "More than 5,000": 7500,
};

async function getCurrentUserWorkspaceId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: workspaceMember, error } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!workspaceMember?.workspace_id) {
    throw new Error("No workspace found for this account.");
  }

  return workspaceMember.workspace_id;
}

function slugifyWorkspaceName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_SLUG_LENGTH);
}

async function generateUniqueWorkspaceSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceName: string,
) {
  const baseSlug = slugifyWorkspaceName(workspaceName) || "workspace";

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const { data, error } = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return slug;
    }
  }

  throw new Error("Unable to generate a unique workspace slug. Please try again.");
}

export async function createWorkspaceAction(
  _previousState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const payload = workspaceSetupSchema.safeParse({
    workspaceName: formData.get("workspaceName"),
    role: formData.get("role"),
  });

  if (!payload.success) {
    const fieldErrors = payload.error.flatten().fieldErrors;

    return {
      errors: {
        workspaceName: fieldErrors.workspaceName?.[0],
        role: fieldErrors.role?.[0],
      },
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        errors: {
          form: userError?.message ?? "You must be signed in to create a workspace.",
        },
        toast: "We couldn't verify your session. Please sign in again.",
      };
    }

    const slug = await generateUniqueWorkspaceSlug(supabase, payload.data.workspaceName);

    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .insert({
        name: payload.data.workspaceName,
        slug,
        owner_id: user.id,
        plan: "trial",
      })
      .select("id")
      .single();

    if (workspaceError || !workspace) {
      return {
        errors: {
          form: workspaceError?.message ?? "Unable to create your workspace.",
        },
        toast: "Workspace setup failed. Please try again.",
      };
    }

    const { error: membershipError } = await supabase.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: "owner",
    });

    if (membershipError) {
      return {
        errors: {
          form: membershipError.message,
        },
        toast: "Workspace created, but we couldn't finish setup. Please try again.",
      };
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: user.user_metadata.full_name ?? null,
      onboarding_completed: false,
    });

    if (profileError) {
      return {
        errors: {
          form: profileError.message,
        },
        toast: "Workspace saved, but profile setup needs another try.",
      };
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        role: payload.data.role,
        workspace_name: payload.data.workspaceName,
      },
    });

    if (metadataError) {
      return {
        errors: {
          form: metadataError.message,
        },
        toast: "Workspace saved, but we couldn't store your role preference.",
      };
    }
  } catch (error) {
    return {
      errors: {
        form: error instanceof Error ? error.message : "Unexpected onboarding error.",
      },
      toast: "Database save failed. Please try again.",
    };
  }

  redirect("/onboarding/company");
}

export async function saveCompanyDetailsAction(
  _previousState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const payload = companyDetailsSchema.safeParse({
    totalUsersRange: formData.get("totalUsersRange"),
    mrrRange: formData.get("mrrRange"),
    productType: formData.get("productType"),
  });

  if (!payload.success) {
    const fieldErrors = payload.error.flatten().fieldErrors;

    return {
      errors: {
        totalUsersRange: fieldErrors.totalUsersRange?.[0],
        mrrRange: fieldErrors.mrrRange?.[0],
        productType: fieldErrors.productType?.[0],
      },
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        errors: {
          form: userError?.message ?? "You must be signed in to continue onboarding.",
        },
        toast: "We couldn't verify your session. Please sign in again.",
      };
    }

    const workspaceId = await getCurrentUserWorkspaceId(supabase, user.id);

    const { error: updateError } = await supabase
      .from("workspaces")
      .update({
        total_users: USER_RANGE_TO_ESTIMATE[payload.data.totalUsersRange],
        mrr_range: payload.data.mrrRange,
        product_type: payload.data.productType,
      })
      .eq("id", workspaceId);

    if (updateError) {
      return {
        errors: {
          form: updateError.message,
        },
        toast: "Database save failed. Please try again.",
      };
    }
  } catch (error) {
    return {
      errors: {
        form: error instanceof Error ? error.message : "Unexpected onboarding error.",
      },
      toast: "Database save failed. Please try again.",
    };
  }

  redirect("/onboarding/connect");
}

export async function uploadFeedbackFileAction(
  _previousState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const uploadedFile = formData.get("feedbackFile");
  const redirectTo = typeof formData.get("redirectTo") === "string" ? formData.get("redirectTo") : null;
  const nextPath =
    typeof redirectTo === "string" && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/onboarding/done";

  if (!(uploadedFile instanceof File) || uploadedFile.size === 0) {
    return {
      errors: {
        file: "Upload a CSV or JSON file to continue.",
      },
    };
  }

  const validMimeTypes = new Set([
    "text/csv",
    "application/csv",
    "application/json",
    "text/json",
    "",
  ]);
  const fileExtension = uploadedFile.name.split(".").pop()?.toLowerCase();
  const isValidExtension = fileExtension === "csv" || fileExtension === "json";

  if (!isValidExtension || !validMimeTypes.has(uploadedFile.type)) {
    return {
      errors: {
        file: "Only .csv and .json files are supported.",
      },
      toast: "Upload a valid CSV or JSON export.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        errors: {
          form: userError?.message ?? "You must be signed in to upload a file.",
        },
        toast: "We couldn't verify your session. Please sign in again.",
      };
    }

    const workspaceId = await getCurrentUserWorkspaceId(supabase, user.id);
    const adminClient = createAdminClient();
    const timestamp = Date.now();
    const safeName = uploadedFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const filePath = `${workspaceId}/${timestamp}-${randomUUID()}-${safeName}`;
    const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());

    const { error: uploadError } = await adminClient.storage
      .from("feedback-uploads")
      .upload(filePath, fileBuffer, {
        contentType:
          uploadedFile.type || (fileExtension === "json" ? "application/json" : "text/csv"),
        upsert: false,
      });

    if (uploadError) {
      return {
        errors: {
          form: uploadError.message,
        },
        toast: "We couldn't upload your file. Please try again.",
      };
    }

    const { error: integrationError } = await supabase.from("integrations").insert({
      workspace_id: workspaceId,
      type: "csv_upload",
      credentials: {},
      config: {
        file_path: filePath,
        file_name: uploadedFile.name,
        uploaded_at: new Date(timestamp).toISOString(),
      },
      status: "active",
    });

    if (integrationError) {
      return {
        errors: {
          form: integrationError.message,
        },
        toast: "File uploaded, but we couldn't save the integration record.",
      };
    }
  } catch (error) {
    return {
      errors: {
        form: error instanceof Error ? error.message : "Unexpected upload error.",
      },
      toast: "Database save failed. Please try again.",
    };
  }

  redirect(nextPath);
}

export async function completeOnboardingAction() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      redirect("/login?error=Please sign in to continue.");
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id);

    if (profileError) {
      redirect(`/onboarding/done?error=${encodeURIComponent(profileError.message)}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to complete onboarding.";
    redirect(`/onboarding/done?error=${encodeURIComponent(message)}`);
  }

  redirect("/dashboard");
}
