"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Toast } from "@/components/ui/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createWorkspaceAction } from "@/lib/onboarding/actions";
import { workspaceRoleOptions } from "@/lib/validations/onboarding";

const initialState = {
  errors: {},
  toast: undefined,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full bg-slate-950 text-white hover:bg-slate-800" type="submit" disabled={pending}>
      {pending ? "Saving workspace..." : "Continue"}
    </Button>
  );
}

export function WorkspaceForm() {
  const [state, formAction] = useActionState(createWorkspaceAction, initialState);

  return (
    <>
      <form action={formAction} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="workspaceName">Workspace name</Label>
          <Input
            id="workspaceName"
            name="workspaceName"
            placeholder="Acme Inc"
            aria-invalid={state.errors?.workspaceName ? "true" : "false"}
          />
          {state.errors?.workspaceName ? (
            <p className="text-sm text-red-600">{state.errors.workspaceName}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Your role</Label>
          <Select id="role" name="role" defaultValue="" aria-invalid={state.errors?.role ? "true" : "false"}>
            <option value="" disabled>
              Select your role
            </option>
            {workspaceRoleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </Select>
          {state.errors?.role ? <p className="text-sm text-red-600">{state.errors.role}</p> : null}
        </div>
        {state.errors?.form ? <Alert variant="destructive">{state.errors.form}</Alert> : null}
        <SubmitButton />
      </form>
      {state.toast ? <Toast message={state.toast} /> : null}
    </>
  );
}
