import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, Loader2, Download } from "lucide-react";

/**
 * Dark‑themed (black + teal) UI for the AI background‑blur tool.
 * Logic is identical to your previous version – only the UI/UX is upgraded.
 */
export default function BlurBgApp() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [radius, setRadius] = useState(10);
  const [resultImg, setResultImg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("rapidapi_ai_bg_key") || ""
  );
  const inputRef = useRef(null);
  const previousUrlRef = useRef(null);

  // ───────────────────────── helpers ──────────────────────────
  const pickFile = () => inputRef.current?.click();

  const handleSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setResultImg(null); // reset any previous result
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setResultImg(null);
    }
  };

  const handleBlur = async () => {
    if (!selectedFile) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("image", selectedFile);
      form.append("radius", String(radius));

      const response = await fetch(
        "https://ai-background-remover.p.rapidapi.com/image/blur/v1",
        {
          method: "POST",
          headers: {
            "x-rapidapi-host": "ai-background-remover.p.rapidapi.com",
            "x-rapidapi-key":
              apiKey || "cb3f919c25mshe7e6383f6f24ab8p12fd16jsn654b897e1185",
            // Do not set Content-Type manually when sending FormData
          },
          body: form,
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Failed to process image");
      }

      const blob = await response.blob();

      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
      }
      const newUrl = URL.createObjectURL(blob);
      previousUrlRef.current = newUrl;
      setResultImg(newUrl);
    } catch (err) {
      alert(err.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
      }
    };
  }, []);

  const handleSaveKey = () => {
    const trimmed = (apiKey || "").trim();
    if (!trimmed) {
      alert("Please enter a valid RapidAPI key.");
      return;
    }
    try {
      localStorage.setItem("rapidapi_ai_bg_key", trimmed);
      setApiKey(trimmed);
      alert("API key saved. It will be used for future requests.");
    } catch (_) {
      alert("Unable to save key in this browser.");
    }
  };

  const handleClearKey = () => {
    try {
      localStorage.removeItem("rapidapi_ai_bg_key");
    } catch (_) {}
    setApiKey("");
  };

  // ───────────────────────── UI ───────────────────────────────
  return (
    <div className="bg-black w-full text-gray-200 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-black border border-neutral-800 rounded-2xl px-6 py-4 shadow">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-[#23b5b5] to-cyan-400 rounded-full mb-3">
              <UploadCloud className="w-7 h-7 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              AI Background <span className="text-[#23b5b5]">Blurrer</span>
            </h1>
            <p className="text-neutral-400 text-base max-w-2xl mx-auto">
              Blur the background of your images with AI. Upload, adjust the
              radius, and process in seconds.
            </p>
          </div>
        </div>

        {/* Upload Panel */}
        <div className="bg-black border border-neutral-800 rounded-2xl p-6 mb-6 backdrop-blur">
          <div
            onClick={pickFile}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="w-full p-10 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition text-center hover:bg-[#23b5b5]/5 hover:border-[#23b5b5]/50"
          >
            {selectedFile ? (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="preview"
                className="max-h-64 object-contain rounded-lg"
              />
            ) : (
              <>
                <UploadCloud className="w-16 h-16 mb-4 stroke-[#23b5b5]" />
                <p className="text-sm text-neutral-300">
                  Click or drag an image here to upload
                </p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleSelect}
            />
          </div>
        </div>

        {/* API Key + Controls */}
        <div className="bg-black border border-neutral-800 rounded-2xl p-6 mb-6 backdrop-blur">
          <div className="mb-5">
            <label className="block text-sm text-neutral-300 mb-2">
              Use your own RapidAPI key
            </label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your RapidAPI key"
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#23b5b5]"
              />
              <button
                onClick={handleSaveKey}
                className="px-3 py-2 rounded-md bg-[#23b5b5] text-black text-sm font-semibold"
              >
                Save Key
              </button>
              <button
                onClick={handleClearKey}
                className="px-3 py-2 rounded-md bg-neutral-800 text-neutral-200 text-sm"
              >
                Clear
              </button>
            </div>
            <p className="text-xs text-neutral-400 mt-2">
              Get a key from{" "}
              <a
                href="https://rapidapi.com/firdavscoder1/api/ai-background-remover"
                target="_blank"
                rel="noreferrer"
                className="text-[#23b5b5] underline"
              >
                RapidAPI – AI Background Remover
              </a>
              . If empty, the default demo key is used.
            </p>
          </div>
          <div className="w-full flex items-center gap-4">
            <label
              htmlFor="radius"
              className="whitespace-nowrap text-sm text-neutral-300"
            >
              Blur radius:
            </label>
            <input
              id="radius"
              type="range"
              min={1}
              max={50}
              value={radius}
              onChange={(e) =>
                setRadius(e.target.valueAsNumber || Number(e.target.value))
              }
              className="flex-1 accent-[#23b5b5]"
            />
            <span className="w-10 text-right font-mono">{radius}</span>
          </div>
        </div>

        {/* Action */}
        <div className="text-center mb-6">
          <button
            onClick={handleBlur}
            disabled={!selectedFile || loading}
            className="inline-flex items-center gap-2 px-10 py-3 rounded-full bg-gradient-to-r from-[#23b5b5] to-cyan-400 text-black font-semibold hover:from-[#23b5b5]/90 hover:to-cyan-400/90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-[#23b5b5]/20"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            Blur Background
          </button>
        </div>

        {/* Result Preview */}
        {resultImg && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 backdrop-blur">
            <div className="w-full">
              <h2 className="text-base font-semibold text-white mb-3 text-center">
                Result
              </h2>
              <img src={resultImg} alt="result" className="rounded-xl shadow" />
              <div className="flex justify-center items-center mt-6">
                <a href={resultImg} download="blurred.png">
                  <button className="inline-flex items-center gap-2 bg-gradient-to-r from-[#23b5b5] to-cyan-400 text-black font-semibold py-2 px-6 rounded-full">
                    <Download className="w-5 h-5" />
                    Download Image
                  </button>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
