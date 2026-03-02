"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function SignInButton() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!username || !password) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    try {
      setLoading(true);
      const response = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });

      if (!response) {
        setError("ไม่สามารถเข้าสู่ระบบได้");
        return;
      }

      if (response.error) {
        const message =
          response.error === "CredentialsSignin"
            ? "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
            : response.error || "ไม่สามารถเข้าสู่ระบบได้";
        setError(message);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Sign in error:", err);
      setError("ไม่สามารถเข้าสู่ระบบได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium text-slate-700">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="w-full rounded-[20px] border-0 bg-gray-50 px-6 py-3 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-[#5A51D4] placeholder:text-slate-400"
          placeholder="Enter your username"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-[20px] border-0 bg-gray-50 px-6 py-3 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-[#5A51D4] placeholder:text-slate-400"
          placeholder="Enter your password"
          disabled={loading}
        />
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <button
        type="submit"
        className="flex h-[53px] w-full items-center justify-center rounded-[20px] bg-[#5A51D4] px-4 text-xl font-bold text-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] transition hover:bg-[#4a42b8] disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
