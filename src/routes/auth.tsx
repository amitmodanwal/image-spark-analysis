import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Scan, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";


const title = "Sign in — EvidenceLens AI";
const description = "Sign in to save and revisit your image relationship analyses.";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && user) void navigate({ to: "/", replace: true });
  }, [authLoading, user, navigate]);


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) throw err;
        setNotice("Account created. If email confirmation is on, check your inbox.");
        const { data } = await supabase.auth.getSession();
        if (data.session) void navigate({ to: "/" });
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        void navigate({ to: "/" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-12">
      <div className="glass-panel w-full max-w-md rounded-3xl p-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="bg-signal grid size-10 place-items-center rounded-2xl text-primary-foreground">
            <Scan className="size-5" aria-hidden />
          </span>
          <span className="text-base font-bold tracking-tight text-foreground">EvidenceLens AI</span>
        </Link>

        <h1 className="mt-7 text-2xl font-bold text-foreground">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Save your analyses and revisit them any time.
        </p>

        {!supabaseConfigured && (
          <p className="mt-5 flex items-start gap-2 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-xs text-foreground">
            <TriangleAlert className="mt-px size-4 shrink-0 text-warning" aria-hidden />
            Supabase keys are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-2xl border border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground">
              {notice}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={busy || !supabaseConfigured}
            className="bg-signal w-full rounded-xl font-semibold text-primary-foreground"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-5 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setNotice(null);
          }}
        >
          {mode === "signin"
            ? "No account? Create one"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
