import React, { useState, useRef } from "react";
import { Upload, Download, Camera, Loader2, X, Sparkles } from "lucide-react";

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [filteredImage, setFilteredImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("basic");
  const [selectedFilter, setSelectedFilter] = useState("");
  const fileInputRef = useRef();

  const filterCategories = {
    basic: {
      name: "Basic Filters",
      icon: "🎨",
      filters: [
        { id: "grayscale", name: "Grayscale", description: "Classic B&W" },
        { id: "sepia", name: "Sepia", description: "Vintage brown" },
        { id: "invert", name: "Invert", description: "Negative colors" },
        { id: "blur", name: "Blur", description: "Soft focus" },
        { id: "brightness", name: "Bright", description: "Enhanced light" },
        { id: "contrast", name: "Contrast", description: "High contrast" },
      ],
    },
    instagram: {
      name: "Instagram Style",
      icon: "📸",
      filters: [
        { id: "clarendon", name: "Clarendon", description: "Bright & vibrant" },
        { id: "gingham", name: "Gingham", description: "Soft B&W" },
        { id: "moon", name: "Moon", description: "Enhanced grayscale" },
        { id: "lark", name: "Lark", description: "Bright & airy" },
        { id: "reyes", name: "Reyes", description: "Vintage warmth" },
        { id: "juno", name: "Juno", description: "Vibrant saturation" },
        { id: "slumber", name: "Slumber", description: "Soft & dreamy" },
        { id: "crema", name: "Crema", description: "Warm & bright" },
        { id: "ludwig", name: "Ludwig", description: "Soft vintage" },
        { id: "aden", name: "Aden", description: "Bright & warm" },
      ],
    },
    professional: {
      name: "Professional",
      icon: "💼",
      filters: [
        { id: "portrait", name: "Portrait", description: "Perfect for faces" },
        { id: "landscape", name: "Landscape", description: "Nature shots" },
        { id: "vintage", name: "Vintage", description: "Film look" },
        { id: "dramatic", name: "Dramatic", description: "High contrast" },
        { id: "soft", name: "Soft", description: "Dreamy focus" },
        { id: "warm", name: "Warm", description: "Warm tones" },
        { id: "cool", name: "Cool", description: "Cool blues" },
        { id: "hdr", name: "HDR", description: "Dynamic range" },
      ],
    },
    artistic: {
      name: "Artistic",
      icon: "🎭",
      filters: [
        { id: "comic", name: "Comic", description: "Comic book style" },
        { id: "dreamy", name: "Dreamy", description: "Soft artistic" },
        { id: "neon", name: "Neon", description: "Vibrant colors" },
        { id: "retro", name: "Retro", description: "80s style" },
        { id: "cyberpunk", name: "Cyberpunk", description: "Futuristic" },
        { id: "pastel", name: "Pastel", description: "Soft pastels" },
      ],
    },
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setFilteredImage("");
      setSelectedFilter("");
    }
  };

  const applyFilter = async (filterId) => {
    if (!selectedFile) return;

    setLoading(true);
    setSelectedFilter(filterId);

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("filterType", filterId);
    formData.append("category", activeCategory);

    try {
      const response = await fetch("http://localhost:8000/api/filter/apply", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setFilteredImage(`http://localhost:8000${data.filteredImageUrl}`);
      } else {
        alert("Filter application failed: " + data.error);
      }
    } catch (error) {
      console.error("Error applying filter:", error);
      alert("Error applying filter");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async () => {
    if (filteredImage) {
      try {
        const response = await fetch(filteredImage);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `filtered_${selectedFilter}_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Download failed:", error);
        alert("Download failed");
      }
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setFilteredImage("");
    setSelectedFilter("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className=" text-sm">
      {/* Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="p-2 bg-[#23b5b5]/20 backdrop-blur-lg rounded-xl">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              Image Filter Studio
            </h1>
            <div className="p-2 bg-[#23b5b5]/20 backdrop-blur-lg rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-base text-gray-300">
            Transform your photos with professional filters
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="px-2 py-1 bg-[#23b5b5]/30 text-[#23b5b5] rounded-full text-xs">
              30 Filters
            </span>
            <span className="px-2 py-1 bg-[#23b5b5]/10 text-[#23b5b5] rounded-full text-xs">
              4 Categories
            </span>
            <span className="px-2 py-1 bg-[#23b5b5]/10 text-[#23b5b5] rounded-full text-xs">
              No Database
            </span>
          </div>
        </div>

        {/* Upload Section */}
        <div className="max-w-3xl mx-auto mb-6">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10 shadow-xl">
            <div className="text-center">
              {!selectedFile ? (
                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 hover:border-[#23b5b5] transition-colors duration-300">
                  <Camera className="w-10 h-10 text-white/60 mx-auto mb-2" />
                  <h3 className="text-xl font-semibold text-white mb-1">
                    Upload Your Image
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Choose a photo to start applying filters
                  </p>
                  <label className="inline-flex items-center gap-2 bg-[#23b5b5] hover:bg-[#1fa1a1] text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg transform hover:scale-105">
                    <Upload className="w-4 h-4" />
                    Select Image
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#23b5b5] rounded-lg flex items-center justify-center">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium text-sm">
                        {selectedFile.name}
                      </p>
                      <p className="text-gray-300 text-xs">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <label className="bg-[#23b5b5] hover:bg-[#1fa1a1] text-white px-3 py-1.5 rounded-md transition-colors duration-200 cursor-pointer flex items-center gap-1">
                      <Upload className="w-4 h-4" />
                      Change
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={clearImage}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md transition-colors duration-200 flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Categories */}
        {selectedFile && (
          <div className="max-w-5xl mx-auto mb-6">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10 shadow-xl">
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {Object.entries(filterCategories).map(([key, category]) => (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                      activeCategory === key
                        ? "bg-[#23b5b5] text-white shadow-md scale-105"
                        : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    <span className="text-lg">{category.icon}</span>
                    {category.name}
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      {category.filters.length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {filterCategories[activeCategory].filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => applyFilter(filter.id)}
                    disabled={loading}
                    className={`group p-3 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 ${
                      selectedFilter === filter.id
                        ? "border-[#23b5b5] bg-[#23b5b5]/20 shadow-md"
                        : "border-white/20 bg-white/10 hover:border-[#23b5b5] hover:bg-white/20"
                    } ${
                      loading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:shadow-md"
                    }`}
                  >
                    <div className="text-center">
                      <h3 className="text-white font-semibold text-sm mb-1">
                        {filter.name}
                      </h3>
                      <p className="text-gray-400 text-xs">
                        {filter.description}
                      </p>
                      {selectedFilter === filter.id && loading && (
                        <div className="mt-2">
                          <Loader2 className="w-4 h-4 animate-spin mx-auto text-[#23b5b5]" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Image Preview */}
        {previewUrl && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10 shadow-xl">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white">Original</h3>
                  </div>
                  <div className="bg-black/20 rounded-xl p-2 aspect-square">
                    <img
                      src={previewUrl}
                      alt="Original"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white">
                      {selectedFilter ? `${selectedFilter} Filter` : "Preview"}
                    </h3>
                    {filteredImage && (
                      <button
                        onClick={downloadImage}
                        className="flex items-center gap-1 bg-[#23b5b5] hover:bg-[#1fa1a1] text-white px-3 py-1.5 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg transform hover:scale-105 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    )}
                  </div>
                  <div className="bg-black/20 rounded-xl p-2 aspect-square flex items-center justify-center">
                    {loading ? (
                      <div className="text-center text-white">
                        <Loader2 className="w-10 h-10 animate-spin mx-auto mb-2 text-[#23b5b5]" />
                        <p className="text-base">
                          Applying {selectedFilter} filter...
                        </p>
                        <p className="text-gray-400 text-xs">
                          This may take a moment
                        </p>
                      </div>
                    ) : filteredImage ? (
                      <img
                        src={filteredImage}
                        alt="Filtered"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="text-center text-gray-400">
                        <Camera className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-base">
                          Select a filter to see the magic
                        </p>
                        <p className="text-xs">
                          Choose from{" "}
                          {filterCategories[activeCategory].filters.length}{" "}
                          {filterCategories[activeCategory].name.toLowerCase()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
