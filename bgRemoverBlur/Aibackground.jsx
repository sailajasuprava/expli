import React, { useState } from "react";

const Aibackground = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [color, setColor] = useState("#23b5b5");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async () => {
    if (!image || !color) {
      alert("Please select an image and color");
      return;
    }

    try {
      setLoading(true);
      // Prefer saved RapidAPI key, else fallback to demo
      const savedKey = localStorage.getItem("rapidapi_ai_bg_key");
      const apiKey =
        savedKey || "cb3f919c25mshe7e6383f6f24ab8p12fd16jsn654b897e1185";

      // Send to RapidAPI Color Background endpoint
      const formData = new FormData();
      formData.append("image", image);
      const hex = (color || "").replace("#", "");
      const r = parseInt(hex.slice(0, 2), 16) || 0;
      const g = parseInt(hex.slice(2, 4), 16) || 0;
      const b = parseInt(hex.slice(4, 6), 16) || 0;
      const rgbaTuple = `(${r},${g},${b},255)`;
      formData.append("bgcolor", rgbaTuple);

      const response = await fetch(
        "https://ai-background-remover.p.rapidapi.com/image/color/v1",
        {
          method: "POST",
          headers: {
            "x-rapidapi-host": "ai-background-remover.p.rapidapi.com",
            "x-rapidapi-key": apiKey,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`RapidAPI Error: ${response.status} - ${errorText}`);
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setResult(imageUrl);
      setLoading(false);
    } catch (err) {
      console.error("Upload error:", err.message);
      alert(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-black text-white p-6 flex justify-center items-start">
      <div className="w-full max-w-4xl space-y-8">
        <h2 className="text-3xl font-bold text-center text-[#23b5b5]">
          Replace Background with Solid Color
        </h2>

        <div className="bg-black border border-neutral-800 p-6 rounded-2xl shadow-xl space-y-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-3 py-2 bg-black text-white border border-neutral-700 rounded-md"
          />

          <div>
            <label
              htmlFor="color"
              className="block mb-2 text-sm text-neutral-300"
            >
              Select Background Color
            </label>
            <input
              type="color"
              id="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-12 rounded-md border-2 border-[#23b5b5] cursor-pointer"
              style={{ backgroundColor: "#0a0a0a" }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#23b5b5] to-cyan-400 hover:from-[#1ab0b0] hover:to-cyan-300 text-black font-semibold py-2 rounded-md transition duration-200"
          >
            {loading ? (
              <div className="flex justify-center items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-black"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Processing...
              </div>
            ) : (
              "Submit"
            )}
          </button>
        </div>

        {(imagePreview || result) && (
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            {imagePreview && (
              <div>
                <h3 className="font-semibold text-[#23b5b5] text-lg mb-2">
                  Original Image:
                </h3>
                <img
                  src={imagePreview}
                  alt="Original Preview"
                  className="w-full rounded-md border-2 border-[#23b5b5]"
                />
              </div>
            )}

            {result && (
              <div>
                <h3 className="font-semibold text-[#23b5b5] text-lg mb-2">
                  Result:
                </h3>
                <img
                  src={result}
                  alt="Result"
                  className="w-full rounded-md border-2 border-[#23b5b5]"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Aibackground;
