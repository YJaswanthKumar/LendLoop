import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getApiError } from "@/api/api";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Sign up — ROL" },
      { name: "description", content: "Create a free ROL account and start renting or lending items in your neighbourhood." },
      { property: "og:title", content: "Sign up — ROL" },
      { property: "og:description", content: "Join the community asset-sharing platform." },
    ],
  }),
  component: RegisterPage,
});

const initial = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  city: "",
  state: "",
  country: "",
};

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof typeof initial, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.fullName.trim().length < 2) errs.fullName = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email address";
    if (form.password.length < 8) errs.password = "Password must be at least 8 characters";
    if (form.phone && !/^[0-9+\-\s]{7,15}$/.test(form.phone)) errs.phone = "Enter a valid phone number";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        country: form.country.trim() || undefined,
      });
      toast.success("Account created — welcome to ROL!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const field = (
    key: keyof typeof initial,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div>
      <label className="mb-1 block text-sm font-semibold" htmlFor={key}>{label}</label>
      <input
        id={key}
        className="input-base"
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        {...props}
      />
      {errors[key] && <p className="mt-1 text-xs text-destructive">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="mx-auto flex max-w-lg flex-col px-4 py-14">
      <h1 className="text-3xl font-extrabold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Start renting and lending in your community.
      </p>
      <form onSubmit={onSubmit} className="card-elevated mt-6 space-y-4 p-6" noValidate>
        {field("fullName", "Full name *", { placeholder: "Asha Rao", autoComplete: "name" })}
        <div className="grid gap-4 sm:grid-cols-2">
          {field("email", "Email *", { type: "email", placeholder: "you@example.com", autoComplete: "email" })}
          {field("password", "Password *", { type: "password", placeholder: "Min. 8 characters", autoComplete: "new-password" })}
        </div>
        {field("phone", "Phone", { placeholder: "9876543210", autoComplete: "tel" })}
        <div className="grid gap-4 sm:grid-cols-3">
          {field("city", "City", { placeholder: "Hyderabad" })}
          {field("state", "State", { placeholder: "Telangana" })}
          {field("country", "Country", { placeholder: "India" })}
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-sm">
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
