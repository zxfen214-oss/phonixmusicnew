import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Lock, User, Eye, EyeOff, Loader2, Sparkles, Music2, Headphones } from "lucide-react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const CLUB_OPTIONS = ["CC", "ADB", "IQ", "CV", "QI", "HUZ", "MLC", "BCC"] as const;

function BgBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="brand-blob h-[440px] w-[440px] -top-24 -left-24"
        style={{ background: "hsl(var(--brand-1) / 0.55)" }}
      />
      <div
        className="brand-blob h-[520px] w-[520px] top-1/3 -right-32"
        style={{ background: "hsl(var(--brand-3) / 0.5)", animationDelay: "1.5s" }}
      />
      <div
        className="brand-blob h-[380px] w-[380px] -bottom-24 left-1/4"
        style={{ background: "hsl(var(--brand-2) / 0.45)", animationDelay: "3s" }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}

function HeroPanel() {
  return (
    <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden">
      <BgBlobs />
      <div className="relative z-10">
        <Logo size="lg" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 space-y-6 max-w-md"
      >
        <div className="inline-flex items-center gap-2 rounded-full glass-strong px-3 py-1.5 text-xs font-medium text-foreground/80">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          A new way to feel your music
        </div>
        <h1 className="text-5xl font-black leading-[1.05] tracking-tight">
          Sound that <span className="text-gradient-animated">moves</span> with you.
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Studio-grade lyrics, real-time karaoke, and your entire library — beautifully reimagined.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {[
            { icon: Music2, label: "Lossless audio" },
            { icon: Headphones, label: "Live lyrics" },
            { icon: Sparkles, label: "AI karaoke" },
          ].map((f) => (
            <span
              key={f.label}
              className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs font-medium text-foreground/75"
            >
              <f.icon className="h-3.5 w-3.5 text-accent" />
              {f.label}
            </span>
          ))}
        </div>
      </motion.div>
      <p className="relative z-10 text-xs text-muted-foreground">
        © {new Date().getFullYear()} PhonixMusic
      </p>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  trailing?: React.ReactNode;
  rightLabel?: React.ReactNode;
}
function Field({ id, label, icon: Icon, type = "text", value, onChange, placeholder, required, trailing, rightLabel }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
          {label}
        </Label>
        {rightLabel}
      </div>
      <div className="relative group">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-accent" />
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="h-11 pl-10 pr-10 bg-secondary/60 border-transparent focus-visible:bg-background focus-visible:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/20 transition-all rounded-xl"
        />
        {trailing}
      </div>
    </div>
  );
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [club, setClub] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate("/");
    return null;
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      emailSchema.parse(email);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        setError(validationError.errors[0].message);
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const { error } = await (await import("@/integrations/supabase/client")).supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setError(error.message);
      else setSuccess("Password reset link sent! Check your email.");
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        setError(validationError.errors[0].message);
        return;
      }
    }
    if (!isLogin && !club) {
      setError("Please select your club.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) setError("Invalid email or password. Please try again.");
          else setError(error.message);
        } else navigate("/");
      } else {
        const { error } = await signUp(email, password, displayName, club);
        if (error) {
          if (error.message.includes("User already registered")) setError("This email is already registered. Please sign in instead.");
          else setError(error.message);
        } else {
          setSuccess("Account created! You can now sign in.");
          setIsLogin(true);
        }
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAlerts = () => (
    <AnimatePresence mode="wait">
      {error && (
        <motion.div
          key="err"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="rounded-xl bg-destructive/10 border border-destructive/30 px-3.5 py-2.5 text-sm text-destructive"
        >
          {error}
        </motion.div>
      )}
      {success && (
        <motion.div
          key="ok"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2.5 text-sm text-emerald-600 dark:text-emerald-400"
        >
          {success}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative min-h-screen w-full bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        <HeroPanel />

        <div className="relative flex items-center justify-center p-6 sm:p-10">
          {/* Mobile blobs */}
          <div className="lg:hidden">
            <BgBlobs />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="mb-6 lg:hidden flex justify-center">
              <Logo size="md" />
            </div>

            <div className="glass-strong rounded-3xl p-7 sm:p-9 shadow-lift">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">
                  {isForgotPassword
                    ? "Reset your password"
                    : isLogin
                    ? "Welcome back"
                    : "Create your account"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isForgotPassword
                    ? "We'll email you a secure link."
                    : isLogin
                    ? "Sign in to keep the music going."
                    : "Join PhonixMusic in less than a minute."}
                </p>
              </div>

              {!isForgotPassword && !isLogin && (
                <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-secondary/60 p-1">
                  <button
                    type="button"
                    onClick={() => { setIsLogin(true); setError(null); setSuccess(null); }}
                    className="rounded-xl py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    className="rounded-xl py-2 text-sm font-semibold text-foreground bg-background shadow-soft"
                  >
                    Sign up
                  </button>
                </div>
              )}
              {!isForgotPassword && isLogin && (
                <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-secondary/60 p-1">
                  <button
                    type="button"
                    className="rounded-xl py-2 text-sm font-semibold text-foreground bg-background shadow-soft"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsLogin(false); setError(null); setSuccess(null); }}
                    className="rounded-xl py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Sign up
                  </button>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.form
                  key={isForgotPassword ? "forgot" : isLogin ? "login" : "signup"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit}
                  className="space-y-4"
                >
                  {!isForgotPassword && !isLogin && (
                    <>
                      <Field
                        id="displayName"
                        label="Display name"
                        icon={User}
                        value={displayName}
                        onChange={setDisplayName}
                        placeholder="Your name"
                      />
                      <div className="space-y-1.5">
                        <Label htmlFor="club" className="text-xs font-medium text-muted-foreground">
                          Club <span className="text-destructive">*</span>
                        </Label>
                        <Select value={club} onValueChange={setClub}>
                          <SelectTrigger className="h-11 bg-secondary/60 border-transparent focus:bg-background focus:border-accent/50 focus:ring-2 focus:ring-accent/20 rounded-xl">
                            <SelectValue placeholder="Select your club" />
                          </SelectTrigger>
                          <SelectContent>
                            {CLUB_OPTIONS.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <Field
                    id="email"
                    label="Email"
                    icon={Mail}
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="you@example.com"
                    required
                  />

                  {!isForgotPassword && (
                    <Field
                      id="password"
                      label="Password"
                      icon={Lock}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={setPassword}
                      placeholder="••••••••"
                      required
                      rightLabel={
                        isLogin ? (
                          <button
                            type="button"
                            onClick={() => { setIsForgotPassword(true); setError(null); setSuccess(null); }}
                            className="text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                          >
                            Forgot password?
                          </button>
                        ) : null
                      }
                      trailing={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      }
                    />
                  )}

                  {renderAlerts()}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "h-11 w-full rounded-xl text-white border-0 font-semibold shadow-glow transition-all hover:shadow-lift hover:-translate-y-0.5 active:translate-y-0",
                      "bg-gradient-brand bg-[length:200%_200%] hover:bg-[length:300%_300%]"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isForgotPassword ? "Sending..." : isLogin ? "Signing in..." : "Creating account..."}
                      </>
                    ) : isForgotPassword ? (
                      "Send reset link"
                    ) : isLogin ? (
                      "Sign in"
                    ) : (
                      "Create account"
                    )}
                  </Button>
                </motion.form>
              </AnimatePresence>

              <div className="mt-6 text-center">
                {isForgotPassword ? (
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(false); setError(null); setSuccess(null); }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back to sign in
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setIsLogin(!isLogin); setError(null); setSuccess(null); }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <span className="font-semibold text-accent">
                      {isLogin ? "Sign up" : "Sign in"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
