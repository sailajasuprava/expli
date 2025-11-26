import React, { useState } from "react";

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [bgImage, setBgImage] = useState(null);
  const [resultImg, setResultImg] = useState("");
  const [finalMergedImage, setFinalMergedImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [mergeSettings, setMergeSettings] = useState({
    scale: 1,
    positionX: 50,
    positionY: 50,
    brightness: 100,
    contrast: 100,
    saturation: 100,
  });

  const handleRemove = async () => {
    if (!selectedFile) return alert("Choose an image first");
    setLoading(true);

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const res = await fetch("http://localhost:8000/api/bg/remove-bg", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to remove background");

      const blob = await res.blob();
      const imageUrl = URL.createObjectURL(blob);
      console.log("Blob type:", blob.type, "Blob size:", blob.size);
      setResultImg(imageUrl);
      console.log(imageUrl);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMerge = async () => {
    if (!resultImg || !bgImage) {
      alert("Please upload both background and processed image.");
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const bg = new Image();
    const fg = new Image();

    const bgUrl = URL.createObjectURL(bgImage);
    const fgUrl = resultImg;

    await new Promise((resolve) => {
      bg.onload = resolve;
      bg.src = bgUrl;
    });

    await new Promise((resolve) => {
      fg.onload = resolve;
      fg.src = fgUrl;
    });

    // Set canvas dimensions to background image
    canvas.width = bg.width;
    canvas.height = bg.height;

    // Draw background
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    // Apply color adjustments to foreground
    ctx.filter = `brightness(${mergeSettings.brightness}%) contrast(${mergeSettings.contrast}%) saturate(${mergeSettings.saturation}%)`;

    // Calculate foreground dimensions and position
    const aspectRatio = fg.width / fg.height;
    let fgWidth = fg.width * mergeSettings.scale;
    let fgHeight = fg.height * mergeSettings.scale;

    // Maintain aspect ratio
    if (fgWidth > canvas.width) {
      fgWidth = canvas.width;
      fgHeight = fgWidth / aspectRatio;
    }
    if (fgHeight > canvas.height) {
      fgHeight = canvas.height;
      fgWidth = fgHeight * aspectRatio;
    }

    // Calculate position based on percentage (0-100 to actual pixels)
    const x = (canvas.width - fgWidth) * (mergeSettings.positionX / 100);
    const y = (canvas.height - fgHeight) * (mergeSettings.positionY / 100);

    // Set blend mode for better integration
    ctx.globalCompositeOperation = "source-over";

    // Draw foreground with calculated dimensions and position
    ctx.drawImage(fg, x, y, fgWidth, fgHeight);

    // Reset filter and blend mode
    ctx.filter = "none";
    ctx.globalCompositeOperation = "source-over";

    const merged = canvas.toDataURL("image/png", 0.95); // Higher quality
    setFinalMergedImage(merged);
  };

  const resetSettings = () => {
    setMergeSettings({
      scale: 1,
      positionX: 50,
      positionY: 50,
      brightness: 100,
      contrast: 100,
      saturation: 100,
    });
  };

  return (
    <div className="min-h-screen py-10 px-4 text-white">
      <div className="max-w-6xl mx-auto bg-black rounded-2xl shadow-2xl p-8 space-y-8 border border-[#23b5b5]/40">
        <h2 className="text-3xl font-bold text-center text-[#23b5b5]">
          AI Background Replacement Tool
        </h2>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* Upload Foreground Image */}
            <div className="space-y-3">
              <label className="block font-semibold text-white/80">
                Upload Foreground Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="w-full bg-black border border-[#23b5b5] text-white rounded px-4 py-2 file:bg-[#23b5b5] file:text-black file:font-bold file:rounded file:px-4 file:py-2"
              />
              <button
                onClick={handleRemove}
                disabled={loading}
                className={`w-full mt-2 px-4 py-2 rounded font-medium transition 
              ${
                loading
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#23b5b5] hover:bg-[#1ca3a3] text-black"
              }`}
              >
                {loading ? "Processing..." : "Remove Background"}
              </button>
            </div>

            {/* Upload Background Image */}
            <div className="space-y-3">
              <label className="block font-semibold text-white/80">
                Upload New Background Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBgImage(e.target.files[0])}
                className="w-full bg-black border border-[#23b5b5] text-white rounded px-4 py-2 file:bg-[#23b5b5] file:text-black file:font-bold file:rounded file:px-4 file:py-2"
              />
            </div>

            {/* Merge Settings */}
            {resultImg && bgImage && (
              <div className="bg-black/50 border border-[#23b5b5]/30 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-[#23b5b5]">
                    Merge Settings
                  </h3>
                  <button
                    onClick={resetSettings}
                    className="text-sm bg-black hover:bg-gray-500 px-3 py-1 rounded transition"
                  >
                    Reset
                  </button>
                </div>

                {/* Scale */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Scale: {mergeSettings.scale.toFixed(2)}x
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.05"
                    value={mergeSettings.scale}
                    onChange={(e) =>
                      setMergeSettings((prev) => ({
                        ...prev,
                        scale: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>

                {/* Position X */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Horizontal Position: {mergeSettings.positionX}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={mergeSettings.positionX}
                    onChange={(e) =>
                      setMergeSettings((prev) => ({
                        ...prev,
                        positionX: parseInt(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>

                {/* Position Y */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Vertical Position: {mergeSettings.positionY}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={mergeSettings.positionY}
                    onChange={(e) =>
                      setMergeSettings((prev) => ({
                        ...prev,
                        positionY: parseInt(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>

                {/* Brightness */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Brightness: {mergeSettings.brightness}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={mergeSettings.brightness}
                    onChange={(e) =>
                      setMergeSettings((prev) => ({
                        ...prev,
                        brightness: parseInt(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>

                {/* Contrast */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Contrast: {mergeSettings.contrast}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={mergeSettings.contrast}
                    onChange={(e) =>
                      setMergeSettings((prev) => ({
                        ...prev,
                        contrast: parseInt(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>

                {/* Saturation */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Saturation: {mergeSettings.saturation}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={mergeSettings.saturation}
                    onChange={(e) =>
                      setMergeSettings((prev) => ({
                        ...prev,
                        saturation: parseInt(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>

                <button
                  onClick={handleMerge}
                  className="w-full bg-[#23b5b5] hover:bg-[#1ca3a3] text-black px-4 py-2 rounded font-semibold transition"
                >
                  Merge Foreground with Background
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Image Previews */}
          <div className="space-y-6">
            {
              <div className="bg-black border border-[#23b5b5]/40 rounded-xl p-4 shadow-lg">
                <h3 className="text-lg font-semibold text-[#23b5b5] mb-3">
                  Foreground Image (Background Removed)
                </h3>
                <img
                  src="http://localhost:5173/dde31fee-378e-4f6a-9571-2e045165287f"
                  alt="Foreground"
                  className="rounded-lg w-full object-contain max-h-64"
                />
              </div>
            }

            {bgImage && (
              <div className="bg-black border border-[#23b5b5]/40 rounded-xl p-4 shadow-lg">
                <h3 className="text-lg font-semibold text-[#23b5b5] mb-3">
                  Background Image
                </h3>
                <img
                  src={URL.createObjectURL(bgImage)}
                  alt="Background"
                  className="rounded-lg w-full object-contain max-h-64"
                />
              </div>
            )}

            {finalMergedImage && (
              <div className="bg-black border border-[#23b5b5]/40 rounded-xl p-4 shadow-lg">
                <h3 className="text-lg font-semibold text-[#23b5b5] mb-3">
                  Final Merged Image
                </h3>
                <img
                  src={finalMergedImage}
                  alt="Merged"
                  className="rounded-lg w-full object-contain"
                />
                <a
                  href={finalMergedImage}
                  download="merged-image.png"
                  className="mt-4 block bg-[#23b5b5] text-black font-bold text-center py-2 rounded hover:opacity-90 transition"
                >
                  Download Merged Image
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
