"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Analysis {
  id: number;
  fileName: string;
  language: string;
  result: string;
  createdAt: string;
}

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [language, setLanguage] = useState<"tr" | "en">("tr");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<Analysis | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/history");
    if (res.ok) {
      const data = await res.json();
      setHistory(data);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleFile = (file: File) => {
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
    setSelectedHistory(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("image", image);
    formData.append("language", language);

    try {
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hata oluştu");
      setResult(data.result);
      loadHistory();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    await fetch("/api/history", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (selectedHistory?.id === id) setSelectedHistory(null);
    loadHistory();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-lg">
            📸
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Instagram Görsel Analiz Paneli</h1>
            <p className="text-xs text-gray-400">AI destekli ekran görüntüsü analizi</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6">
        {/* Sol Panel */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Dil Seçimi */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
            <p className="text-sm text-gray-400 mb-3 font-medium">Analiz Dili</p>
            <div className="flex gap-3">
              <button
                onClick={() => setLanguage("tr")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  language === "tr"
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                🇹🇷 Türkçe
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  language === "en"
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          {/* Görsel Yükleme */}
          <div
            className={`bg-gray-900 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
              dragging ? "border-pink-500 bg-pink-500/5" : "border-gray-700 hover:border-gray-600"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {preview ? (
              <div className="p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Önizleme" className="w-full max-h-72 object-contain rounded-xl" />
                <p className="text-center text-xs text-gray-500 mt-3">Değiştirmek için tıkla veya yeni görsel sürükle</p>
              </div>
            ) : (
              <div className="p-10 text-center">
                <div className="text-5xl mb-4">📷</div>
                <p className="text-gray-300 font-medium mb-1">Görsel sürükle veya tıkla</p>
                <p className="text-gray-500 text-sm">PNG, JPG, WEBP desteklenir</p>
              </div>
            )}
          </div>

          {/* Analiz Butonu */}
          <button
            onClick={handleAnalyze}
            disabled={!image || loading}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 shadow-lg hover:shadow-pink-500/25"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analiz ediliyor...
              </span>
            ) : "✨ Analiz Et"}
          </button>

          {/* Hata */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Sonuç */}
          {result && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
                Analiz Sonucu
              </h2>
              <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{result}</div>
            </div>
          )}
        </div>

        {/* Sağ Panel - Geçmiş */}
        <div className="w-80 flex flex-col gap-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 flex flex-col max-h-[calc(100vh-12rem)] sticky top-8">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="font-semibold text-sm text-gray-300">Analiz Geçmişi</h2>
              <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full">{history.length}</span>
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center text-gray-600 text-sm">
                Henüz analiz yapılmadı
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 divide-y divide-gray-800">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-800/50 transition-colors group ${
                      selectedHistory?.id === item.id ? "bg-gray-800" : ""
                    }`}
                    onClick={() => setSelectedHistory(selectedHistory?.id === item.id ? null : item)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-300 truncate">{item.fileName}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{formatDate(item.createdAt)}</p>
                        <span className="inline-block mt-1 text-xs bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">
                          {item.language === "tr" ? "🇹🇷 TR" : "🇬🇧 EN"}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all text-lg leading-none mt-0.5"
                      >
                        ×
                      </button>
                    </div>
                    {selectedHistory?.id === item.id && (
                      <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {item.result}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
