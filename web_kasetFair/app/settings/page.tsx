"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Database, Lightbulb, Store, UserRound } from "lucide-react";
import { PlannerSidebar } from "../dashboard/components/PlannerSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { LocaleProvider } from "../dashboard/i18n";

const settingSections = [
  {
    title: "Personal info",
    description: "Manage your profile and login methods.",
    icon: UserRound,
    href: "#personal-info",
  },
  {
    title: "Booth",
    description: "Update your booth information.",
    icon: Store,
    href: "#booth",
  },
  {
    title: "Data Management",
    description: "Reset, export, or delete your data.",
    icon: Database,
    href: "#data-management",
  },
  {
    title: "Advisor",
    description: "Customize how ABAS provides insights.",
    icon: Lightbulb,
    href: "#advisor",
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  if (status === "loading") {
    return (
      <LocaleProvider>
        <div className="flex min-h-screen bg-white">
          <div className="w-80 border-r border-[#ecefff] bg-[#fcfbff] p-6">
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
          <div className="flex-1 bg-[#f8f9ff] p-8">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="mt-4 h-40 w-full" />
          </div>
        </div>
      </LocaleProvider>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <LocaleProvider>
      <div className="flex min-h-screen bg-white text-[#2c2f52]">
        <PlannerSidebar
          onLogout={() => signOut({ callbackUrl: "/login" })}
          userName={session?.user?.name}
          userEmail={session?.user?.email}
          userImage={session?.user?.image}
        />

        <main className="flex-1 bg-[#f8f9ff] px-6 py-10 sm:px-10">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
            <header className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#b0b3d6]">
                Setting
              </p>
              <h1 className="text-3xl font-semibold text-[#2e2e6c]">Configure your experience</h1>
            </header>

            <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {settingSections.map(({ title, description, icon: Icon, href }) => (
                <Card
                  key={title}
                  className="flex h-full flex-col justify-between rounded-3xl border-[#e3e6ff] bg-white p-6 text-[#2c2f52] shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-[#e4e7ff] bg-[#f8f9ff] p-4 text-[#4c4bd6]">
                      <Icon className="h-6 w-6" strokeWidth={1.6} />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[#2c2f52]">{title}</p>
                      <p className="mt-1 text-sm text-[#7a80a7]">{description}</p>
                    </div>
                  </div>
                  <Link
                    href={href}
                    className="mt-6 text-sm font-semibold text-[#4c4bd6] hover:text-[#2f3266]"
                  >
                    Manage {title}
                  </Link>
                </Card>
              ))}
            </section>
          </div>
        </main>
      </div>
    </LocaleProvider>
  );
}
