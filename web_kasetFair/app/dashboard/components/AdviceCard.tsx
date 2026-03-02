import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MarkdownContent } from "./MarkdownContent";

type AdviceCardProps = {
  advice: string;
  loading: boolean;
};

export function AdviceCard({ advice, loading }: AdviceCardProps) {
  return (
    <Card className="space-y-4 rounded-3xl border-[#e6e9ff] bg-white shadow-sm">
      <CardHeader className="pb-0">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#b0b3d6]">ABAS Advisor</p>
          <h2 className="text-lg font-semibold text-[#2c2f52]">คำแนะนำจาก AI</h2>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="h-3 w-full animate-pulse rounded bg-slate-200/80" />
            ))}
          </div>
        ) : (
          <div className="space-y-4 rounded-2xl border border-[#edf0ff] bg-[#f8f9ff] p-6 text-sm leading-6 text-[#394168]">
            <div className="text-xs uppercase tracking-[0.4em] text-[#b0b3d6]">This means:</div>
            <MarkdownContent markdown={advice} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
