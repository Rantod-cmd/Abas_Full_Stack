import { Card, CardContent, CardHeader } from "@/components/ui/card";

type AssumptionsCardProps = {
  assumptions: string;
};

export function AssumptionsCard({ assumptions }: AssumptionsCardProps) {
  return (
    <Card className="space-y-3 border-[#e8eaff] shadow-sm">
      <CardHeader className="pb-0">
        <p className="text-sm font-semibold text-[#2c2f52]">Assumptions</p>
      </CardHeader>
      <CardContent>
        <pre className="max-h-[340px] overflow-auto rounded-xl bg-[#0f172a] px-4 py-3 text-xs text-[#c7f3d4]">
          {assumptions}
        </pre>
      </CardContent>
    </Card>
  );
}
