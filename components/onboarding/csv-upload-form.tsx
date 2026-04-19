"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toast } from "@/components/ui/toast";
import {
  OnboardingActionState,
  uploadFeedbackFileAction,
} from "@/lib/onboarding/actions";

const initialState: OnboardingActionState = {
  errors: {},
  toast: undefined,
};

function UploadButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="outline" className="w-full" disabled={pending}>
      {pending ? "Uploading file..." : "Upload file"}
    </Button>
  );
}

export function CsvUploadForm() {
  const [state, formAction] = useActionState(uploadFeedbackFileAction, initialState);

  return (
    <>
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="feedbackFile">CSV or JSON export</Label>
          <Input id="feedbackFile" name="feedbackFile" type="file" accept=".csv,.json" />
          <p className="text-xs text-slate-500">
            Upload a customer feedback export if you&apos;d rather skip the Slack connection for now.
          </p>
          {state.errors?.file ? <p className="text-sm text-red-600">{state.errors.file}</p> : null}
        </div>
        {state.errors?.form ? <Alert variant="destructive">{state.errors.form}</Alert> : null}
        <UploadButton />
      </form>
      {state.toast ? <Toast message={state.toast} /> : null}
    </>
  );
}
