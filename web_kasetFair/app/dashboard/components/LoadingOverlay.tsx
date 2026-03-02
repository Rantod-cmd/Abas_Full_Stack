"use client";

type LoadingOverlayProps = {
  loading: boolean;
};

export function LoadingOverlay({ loading }: LoadingOverlayProps) {
  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity duration-300">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-[#e3e6ff] border-t-[#4c4bd6]" />
        </div>

        <div className="space-y-2 text-center">
          <p className="text-lg font-semibold text-[#4c4bd6]">กำลังประมวลผล...</p>
          <p className="text-sm text-[#7a80a7]">กรุณารอ 3-5 นาที ข้อมูลกำลังถูกสร้าง และ ห้ามปิดหน้าเว็บหรือรีเฟรชหน้าเว็บ</p>
        </div>

        <div className="flex gap-2">
          {[...Array(3)].map((_, idx) => (
            <div
              key={idx}
              className="h-2 w-2 animate-pulse rounded-full bg-[#4c4bd6]"
              style={{ animationDelay: `${idx * 0.2}s`, animationDuration: "1s" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
