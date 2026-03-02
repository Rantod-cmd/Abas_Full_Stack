import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SignInButton } from "./SignInButton";
import { ThemeReset } from "./ThemeReset";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <ThemeReset />
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12),transparent_40%),radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.16),transparent_36%)]" />
          <div className="absolute inset-6 rounded-[28px] border border-white/15 bg-[radial-gradient(circle_at_30%_40%,#1d4ed8_0,#1d4ed8_16%,#0f172a_52%),radial-gradient(circle_at_80%_20%,#2563eb_0,#1e3a8a_38%,#0b1025_70%)] shadow-[0_30px_60px_rgba(0,0,0,0.28)]" />
          <div className="relative h-full min-h-screen rounded-4xl" />
        </div>

        <div className="flex items-center justify-center px-8 py-12 sm:px-12">
          <div className="w-full max-w-md space-y-8">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
              <span>ABAS</span>
              <span className="text-xs text-slate-400">Kaset Fair 2026</span>
            </div>
            <div>
              <h2 className="text-3xl font-semibold leading-tight text-slate-900">
                Sign in
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่านจากบัญชี Kaset Fair ของคุณ
              </p>
            </div>
            <div className="space-y-5">
              <SignInButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
