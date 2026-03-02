import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export function TipsCard() {
    const tips = [
        {
            title: "น้ำแข็งและถังน้ำแข็ง",
            description: "อาจมีผู้ได้รับสัมปทานจากมหาวิทยาลัยอยู่แล้ว แนะนำให้ติดตามประกาศและข่าวสารจากหน่วยงานที่รับผิดชอบ (เช่น กองพัฒนาฯ) อย่างใกล้ชิด"
        },
        {
            title: "การใช้ไฟฟ้า",
            description: "หากมีการใช้อุปกรณ์ไฟฟ้าจำนวนมาก ควรติดตั้ง เบรกเกอร์/อุปกรณ์ป้องกันไฟฟ้า ให้เหมาะสม เพื่อเพิ่มความปลอดภัยและลดความเสี่ยงไฟฟ้าขัดข้อง"
        },
        {
            title: "จุดล้างจานและการขนย้ายอุปกรณ์",
            description: "ควรตรวจสอบตำแหน่งจุดล้างจานล่วงหน้า และวางแผนเส้นทาง/วิธีการขนส่งอุปกรณ์และเครื่องครัวให้ชัดเจน (เช่น เตรียมกะละมังหรือรถเข็นสำหรับขนไป–กลับ)"
        },
        {
            title: "การขายให้ร้านค้านิสิตใกล้เคียง",
            description: "เป็นอีกช่องทางที่น่าสนใจ เพราะหากร้านข้างเคียงพึงพอใจ มีโอกาสเกิดการซื้อซ้ำ และช่วยเพิ่มอัตราการรักษาลูกค้า (Retention) ได้"
        },
        {
            title: "แสงสว่างหน้าร้าน",
            description: "ควรจัดให้บริเวณหน้าร้านสว่างเพียงพอ เพื่อเพิ่มการมองเห็นและดึงดูดลูกค้าให้เข้ามาที่ร้าน"
        },
        {
            title: "การนำเสนอสินค้า",
            description: "ควรโชว์สินค้า วัตถุดิบ และ/หรือกระบวนการทำอาหารในจุดที่ลูกค้ามองเห็นได้ เพื่อสร้างความน่าเชื่อถือและกระตุ้นการตัดสินใจซื้อ"
        }
    ];

    return (
        <Card className="border-[#e8eaff] shadow-sm bg-gradient-to-br from-white to-[#fcfdff]">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef2ff]">
                        <Lightbulb className="h-4 w-4 text-[#4c4bd6]" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-[#2c2f52]">ABAS Tips</p>
                        <p className="text-xs text-[#7a80a7]">ข้อควรทราบสำหรับผู้ค้า</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                    {tips.map((tip, index) => (
                        <div key={index} className="rounded-xl border border-[#edf0ff] bg-white p-3 text-sm text-[#394168] shadow-sm hover:border-[#dbeafe] transition-colors">
                            <p className="mb-1 font-medium text-[#4c4bd6]">{index + 1}. {tip.title}</p>
                            <p className="opacity-90 leading-relaxed text-xs text-slate-600">
                                {tip.description}
                            </p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
