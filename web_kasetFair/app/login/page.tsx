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
    <div className="flex h-screen w-full bg-white text-slate-900">
      <ThemeReset />

      {/* Left visual side */}
      {/* Left visual side */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center relative overflow-hidden bg-slate-900">
        {/* Deep Blue-Purple-Black Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950" />

        {/* Dynamic decorative circles (Space/Galaxy effects) */}
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-3xl animate-pulse" />
        <div className="absolute top-[20%] right-[-10%] h-[400px] w-[400px] rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[20%] h-[600px] w-[600px] rounded-full bg-indigo-900/40 blur-3xl" />

        {/* Central Content */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-8 px-6">
          <h1 className="text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">
            KASETFAIR <span className="text-purple-300">2026</span>
          </h1>

          <div className="flex items-center justify-center hover:scale-105 transition-transform duration-500">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.ico" alt="ABAS Logo" className="h-48 w-48 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
          </div>

          <div className="space-y-4 max-w-md flex flex-col items-center">
            <h2 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-400 drop-shadow-xl animate-in fade-in zoom-in duration-1000">
              ABAS
            </h2>
            <p className="text-indigo-200/80 text-base leading-relaxed font-light">
              วางแผนวิเคราะห์การตลาดต้นทุน<br />สำหรับผู้เริ่มต้นการลงทุนมือใหม่
            </p>
          </div>
        </div>

        {/* Decorative Wave at the bottom/right edge */}
        <svg className="absolute top-0 right-0 h-full w-24 text-slate-50 translate-x-1/2" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 0 C 50 20 80 50 50 100 L 100 100 L 100 0 Z" fill="currentColor" opacity="0.05" />
        </svg>
        <svg className="absolute top-0 right-0 h-full w-48 text-slate-50 translate-x-1/2" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M50 0 C 30 30 60 70 20 100 L 100 100 L 100 0 Z" fill="currentColor" />
        </svg>
      </div>

      {/* Right form side */}
      <div className="flex flex-1 flex-col justify-center px-4 sm:px-12 lg:px-24 xl:px-32 bg-slate-50 relative">
        {/* Mobile Header (Only visible on small screens) */}
        <div className="lg:hidden absolute top-0 left-0 right-0 h-48 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-b-[40px] overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] h-[200px] w-[200px] rounded-full bg-white/10 blur-2xl" />
        </div>

        <div className="z-10 bg-white p-8 sm:p-12 rounded-3xl shadow-xl ring-1 ring-slate-100 max-w-lg w-full mx-auto">
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="h-20 w-20 rounded-full bg-white p-3 shadow-lg flex items-center justify-center -mt-16 ring-4 ring-blue-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/favicon.ico" alt="ABAS Logo" className="h-full w-full object-contain" />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Sign in</h2>
            <p className="mt-2 text-slate-500">
              เข้าสู่ระบบเพื่อจัดการร้านค้าของคุณ
            </p>
          </div>

          <div className="space-y-6">
            <SignInButton />
          </div>

          <div className="mt-8 text-center text-xs text-slate-400">
            By signing in, I agree with Terms & Conditions
          </div>
        </div>
      </div>
    </div>
  );
}
