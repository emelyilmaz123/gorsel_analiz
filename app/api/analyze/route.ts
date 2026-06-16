import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;
    const language = (formData.get("language") as string) || "tr";

    if (!file) {
      return NextResponse.json({ error: "Görsel bulunamadı" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type;

    const prompt =
      language === "tr"
        ? `Bu Instagram ekran görüntüsünü çok detaylı analiz et. Görselde gördüğün HER ŞEYİ tek tek açıkla:
- Profil bilgileri (kullanıcı adı, takipçi sayısı, takip sayısı, biyografi)
- Gönderi içeriği (ne var, ne yazıyor, ne görünüyor)
- Beğeni sayısı, yorum sayısı, kaydetme sayısı
- Yorumlar (varsa, ne yazıyor)
- Hikayeler, önerilen hesaplar, reklamlar (varsa)
- Genel olarak ekranda ne görünüyor, kim ne paylaşmış
- Türkçe olarak detaylıca açıkla`
        : `Analyze this Instagram screenshot in very detail. Explain EVERYTHING you see one by one:
- Profile information (username, follower count, following count, bio)
- Post content (what's there, what it says, what it looks like)
- Like count, comment count, save count
- Comments (if any, what they say)
- Stories, suggested accounts, ads (if any)
- What's generally visible on the screen, who posted what
- Explain in detail in English`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-nano-12b-v2-vl:free",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return NextResponse.json({ error: "API hatası: " + (data.error?.message || "Bilinmeyen hata") }, { status: 500 });
    }

    const result = data.choices?.[0]?.message?.content || "";

    await prisma.analysis.create({
      data: {
        fileName: file.name,
        language,
        result,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Analiz sırasında hata oluştu" }, { status: 500 });
  }
}
