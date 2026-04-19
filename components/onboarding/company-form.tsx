"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import {
  OnboardingActionState,
  saveCompanyDetailsAction,
} from "@/lib/onboarding/actions";
import {
  companyMrrOptions,
  companyProductTypeOptions,
  companyUserRangeOptions,
} from "@/lib/validations/onboarding";

const initialState: OnboardingActionState = {
  errors: {},
  toast: undefined,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full bg-slate-950 text-white hover:bg-slate-800" type="submit" disabled={pending}>
      {pending ? "Saving company details..." : "Continue"}
    </Button>
  );
}

export function CompanyForm() {
  const [state, formAction] = useActionState(saveCompanyDetailsAction, initialState);

  return (
    <>
      <form action={formAction} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="totalUsersRange">Total active users</Label>
          <Select
            id="totalUsersRange"
            name="totalUsersRange"
            defaultValue=""
            aria-invalid={state.errors?.totalUsersRange ? "true" : "false"}
          >
            <option value="" disabled>
              Select active users
            </option>
            {companyUserRangeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          {state.errors?.totalUsersRange ? (
            <p className="text-sm text-red-600">{state.errors.totalUsersRange}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="mrrRange">Monthly Revenue / MRR</Label>
          <Select
            id="mrrRange"
            name="mrrRange"
            defaultValue=""
            aria-invalid={state.errors?.mrrRange ? "true" : "false"}
          >
            <option value="" disabled>
              Select monthly revenue
            </option>
            {companyMrrOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          {state.errors?.mrrRange ? <p className="text-sm text-red-600">{state.errors.mrrRange}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="productType">Product type</Label>
          <Select
            id="productType"
            name="productType"
            defaultValue=""
            aria-invalid={state.errors?.productType ? "true" : "false"}
          >
            <option value="" disabled>
              Select product type
            </option>
            {companyProductTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          {state.errors?.productType ? <p className="text-sm text-red-600">{state.errors.productType}</p> : null}
        </div>

        {state.errors?.form ? <Alert variant="destructive">{state.errors.form}</Alert> : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline" className="w-full">
            <Link href="/onboarding/workspace">Back</Link>
          </Button>
          <SubmitButton />
        </div>
      </form>
      {state.toast ? <Toast message={state.toast} /> : null}
    </>
  );
}
