import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./supabaseAdmin";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username?.trim();
        const password = credentials?.password;

        if (!username || !password) {
          throw new Error("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
        }

        const { data: account, error } = await supabaseAdmin
          .from("accounts")
          .select("user_id, username, password_hash")
          .eq("username", username)
          .maybeSingle();

        if (error) {
          console.error("Fetch account error:", error.message);
          throw new Error("ไม่สามารถเข้าสู่ระบบได้");
        }

        if (!account || !account.password_hash) {
          throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        }

        const passwordMatch = await bcrypt.compare(password, account.password_hash);

        if (!passwordMatch) {
          throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        }

        return {
          id: account.user_id,
          name: account.username,
          username: account.username,
        } as { id: string; name: string; username: string };
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      if (session.user && token.name) {
        session.user.name = token.name;
      }

      return session;
    },
  },
};
