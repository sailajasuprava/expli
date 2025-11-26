import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Download,
  X,
  Loader2,
  Image as ImageIcon,
  Trash2,
  RotateCcw,
  Zap,
  Key,
} from "lucide-react";

const apiKey = "reSe1VEif8KBPdhpzCncgxyF";

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [customApiKey, setCustomApiKey] = useState("");
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [savedApiKey, setSavedApiKey] = useState("");
  const fileInputRef = useRef(null);

  // Load saved API key from localStorage on component mount
  useEffect(() => {
    const savedKey = localStorage.getItem("removebg_api_key");
    if (savedKey) {
      setSavedApiKey(savedKey);
    }
  }, []);

  // Function to save API key to localStorage
  const saveApiKey = (key) => {
    localStorage.setItem("removebg_api_key", key);
    setSavedApiKey(key);
    setShowApiKeyModal(false);
    setCustomApiKey("");
  };

  // Function to remove saved API key
  const removeApiKey = () => {
    localStorage.removeItem("removebg_api_key");
    setSavedApiKey("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file) => {
    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, or WebP)");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setError(null);
    setSelectedFile(file);
    setProcessedImage(null);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("size", "auto");
    formData.append("image_file", selectedFile);

    // Use saved API key first, then custom API key, then default
    const keyToUse = savedApiKey || customApiKey || apiKey;

    try {
      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": keyToUse,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Remove.bg API Error: ${response.status}`;

        // Provide more user-friendly error messages
        if (response.status === 401) {
          errorMessage =
            "Invalid API key. Please check your Remove.bg API key.";
        } else if (response.status === 402) {
          errorMessage =
            "API quota exceeded. You can get your own free API key from Remove.bg to continue using this tool.";
          setShowApiKeyInput(true);
        } else if (response.status === 413) {
          errorMessage = "Image file too large. Please use a smaller image.";
        } else if (response.status === 422) {
          errorMessage = "Invalid image format. Please use JPEG, PNG, or WebP.";
        } else {
          errorMessage += ` - ${errorText}`;
        }

        throw new Error(errorMessage);
      }

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;

    const link = document.createElement("a");
    link.href = processedImage;
    link.download = `no-bg-${selectedFile?.name?.replace(/\.[^/.]+$/, "")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAll = () => {
    setSelectedFile(null);
    setPreview(null);
    setProcessedImage(null);
    setError(null);
    setLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-black py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-black border border-neutral-800 rounded-2xl px-6 py-4 shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1"></div>
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-[#23b5b5] to-cyan-400 rounded-full">
                <Zap className="w-7 h-7 text-black" />
              </div>
              <div className="flex-1 flex justify-end">
                <button
                  onClick={() => setShowApiKeyModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg border border-neutral-700 transition-all text-sm"
                >
                  <Key className="w-4 h-4 mr-2" />
                  {savedApiKey ? "Update API Key" : "Add API Key"}
                </button>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              AI Background <span className="text-[#23b5b5]">Remover</span>
            </h1>
            <p className="text-neutral-400 text-base max-w-2xl mx-auto">
              Transform your images with AI-powered background removal. Upload,
              process, and download in seconds.
            </p>
            {savedApiKey && (
              <div className="mt-3">
                <span className="inline-flex items-center px-3 py-1 bg-green-900/30 text-green-300 text-xs rounded-full border border-green-500/30">
                  <Key className="w-3 h-3 mr-1" />
                  Using your API key
                </span>
              </div>
            )}
          </div>
        </div>

        {/* File Upload Area */}
        <div className="bg-black border border-neutral-800 rounded-2xl p-6 mb-8 backdrop-blur">
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
              dragActive
                ? "border-[#23b5b5] bg-[#23b5b5]/10"
                : selectedFile
                ? "border-[#23b5b5]/40 bg-[#23b5b5]/5"
                : "border-neutral-700 hover:border-[#23b5b5]/50 hover:bg-[#23b5b5]/5"
            }`}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="space-y-6">
                <div className="w-20 h-20 mx-auto bg-[#23b5b5]/20 border border-[#23b5b5]/30 rounded-full flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-[#23b5b5]" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-white mb-1">
                    {selectedFile.name}
                  </p>
                  <p className="text-neutral-400">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetAll();
                  }}
                  className="inline-flex items-center px-4 py-2 text-red-300 hover:text-red-200 hover:bg-red-400/10 rounded-full border border-red-400/30 transition-all"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove File
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-20 h-20 mx-auto bg-neutral-900 rounded-full flex items-center justify-center">
                  <Upload className="w-10 h-10 text-neutral-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white mb-2">
                    Drag & drop your image here
                  </p>
                  <p className="text-neutral-400 text-lg mb-5">
                    or click to browse files
                  </p>
                  <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#23b5b5] to-cyan-400 text-black font-medium rounded-full hover:from-[#23b5b5]/90 hover:to-cyan-400/90 transition-all">
                    <Upload className="w-5 h-5 mr-2" />
                    Choose File
                  </div>
                  <p className="text-neutral-500 text-sm mt-4">
                    Supports: JPEG, PNG, WebP • Max size: 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <X className="w-5 h-5 text-red-400 mr-3" />
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* API Key Input Section */}
        {showApiKeyInput && (
          <div className="bg-neutral-900/50 border border-[#23b5b5]/30 rounded-lg p-6 mb-8">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">
                Get Your Own API Key
              </h3>
              <p className="text-neutral-400 text-sm">
                The current API key has reached its limit. You can get a free
                API key from Remove.bg to continue using this tool.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Your Remove.bg API Key
                </label>
                <input
                  type="text"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="Enter your Remove.bg API key here"
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-[#23b5b5] focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowApiKeyInput(false);
                    setCustomApiKey("");
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2 bg-neutral-800 text-white rounded-lg border border-neutral-700 hover:bg-neutral-700 transition-all"
                >
                  Cancel
                </button>
                <a
                  href="https://www.remove.bg/api#remove-background"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#23b5b5] to-cyan-400 text-black font-medium rounded-lg hover:from-[#23b5b5]/90 hover:to-cyan-400/90 transition-all text-center"
                >
                  Get Free API Key
                </a>
              </div>

              <div className="text-xs text-neutral-500 text-center">
                <p>• Get 50 free API calls per month</p>
                <p>• No credit card required</p>
                <p>• Your API key is stored locally and never shared</p>
              </div>
            </div>
          </div>
        )}

        {/* API Key Modal */}
        {showApiKeyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">
                  {savedApiKey ? "Update API Key" : "Add API Key"}
                </h3>
                <button
                  onClick={() => {
                    setShowApiKeyModal(false);
                    setCustomApiKey("");
                  }}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Remove.bg API Key
                  </label>
                  <input
                    type="text"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="Enter your Remove.bg API key"
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-[#23b5b5] focus:outline-none transition-all"
                  />
                </div>

                <div className="text-xs text-neutral-500">
                  <p>• Get 50 free API calls per month</p>
                  <p>• No credit card required</p>
                  <p>• Your API key is stored locally and never shared</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowApiKeyModal(false);
                      setCustomApiKey("");
                    }}
                    className="flex-1 px-4 py-2 bg-neutral-800 text-white rounded-lg border border-neutral-700 hover:bg-neutral-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (customApiKey.trim()) {
                        saveApiKey(customApiKey.trim());
                      }
                    }}
                    disabled={!customApiKey.trim()}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-[#23b5b5] to-cyan-400 text-black font-medium rounded-lg hover:from-[#23b5b5]/90 hover:to-cyan-400/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {savedApiKey ? "Update" : "Save"} API Key
                  </button>
                </div>

                {savedApiKey && (
                  <div className="pt-4 border-t border-neutral-800">
                    <button
                      onClick={removeApiKey}
                      className="w-full px-4 py-2 bg-red-900/30 text-red-300 rounded-lg border border-red-500/30 hover:bg-red-900/50 transition-all text-sm"
                    >
                      Remove Saved API Key
                    </button>
                  </div>
                )}

                <div className="text-center">
                  <a
                    href="https://www.remove.bg/api#remove-background"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#23b5b5] hover:text-cyan-400 text-sm underline"
                  >
                    Get your free API key from Remove.bg
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Process Button */}
        {selectedFile && !processedImage && (
          <div className="text-center mb-8">
            <button
              onClick={handleUpload}
              disabled={loading}
              className="inline-flex items-center px-10 py-3 bg-gradient-to-r from-[#23b5b5] to-cyan-400 text-black font-semibold text-base rounded-full hover:from-[#23b5b5]/90 hover:to-cyan-400/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-[#23b5b5]/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing Magic...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Remove Background
                  {(savedApiKey || customApiKey) && (
                    <span className="ml-2 text-xs bg-black/20 px-2 py-1 rounded-full">
                      Using Your Key
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        )}

        {/* Image Comparison */}
        {preview && (
          <div className="bg-black border border-neutral-800 rounded-2xl p-6 backdrop-blur">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Original Image */}
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <h3 className="text-base font-semibold text-white bg-neutral-900 px-4 py-2 rounded-full border border-neutral-800">
                    Original Image
                  </h3>
                </div>
                <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
                  <img
                    src={preview}
                    alt="Original"
                    className="w-full h-auto max-h-96 object-contain mx-auto rounded-lg"
                  />
                </div>
              </div>

              {/* Processed Image */}
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <h3 className="text-base font-semibold bg-gradient-to-r from-[#23b5b5] to-cyan-400 bg-clip-text text-transparent bg-neutral-900 px-4 py-2 rounded-full border border-neutral-800">
                    <span className="text-[#23b5b5]">Background Removed</span>
                  </h3>
                </div>
                <div className="bg-neutral-900 rounded-xl border border-neutral-800">
                  {processedImage ? (
                    <div className="p-4">
                      <div className="checkered-bg rounded-lg p-6">
                        <img
                          src={processedImage}
                          alt="Processed"
                          className="w-full h-auto max-h-96 object-contain mx-auto"
                        />
                      </div>
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={downloadImage}
                          className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#23b5b5] to-cyan-400 text-black font-semibold rounded-full transition-all"
                        >
                          <Download className="w-5 h-5 mr-2" />
                          Download PNG
                        </button>
                        <button
                          onClick={resetAll}
                          className="px-6 py-3 bg-neutral-900 text-white rounded-full border border-neutral-700 hover:bg-neutral-800 transition-all"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-neutral-500">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                          <ImageIcon className="w-8 h-8 text-neutral-500" />
                        </div>
                        <p className="text-lg">
                          Processed image will appear here
                        </p>
                        <p className="text-sm text-neutral-600 mt-2">
                          Upload and process to see the magic
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats or Info */}
            {processedImage && (
              <div className="mt-8 pt-6 border-t border-neutral-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-800">
                    <p className="text-[#23b5b5] font-semibold">File Format</p>
                    <p className="text-white">PNG with transparency</p>
                  </div>
                  <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-800">
                    <p className="text-[#23b5b5] font-semibold">
                      Processing Time
                    </p>
                    <p className="text-white">Lightning fast</p>
                  </div>
                  <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-800">
                    <p className="text-[#23b5b5] font-semibold">Quality</p>
                    <p className="text-white">AI-powered precision</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
         .checkered-bg {
           background-image: linear-gradient(45deg, #000 25%, transparent 25%),
             linear-gradient(-45deg, #000 25%, transparent 25%),
             linear-gradient(45deg, transparent 75%, #000 75%),
             linear-gradient(-45deg, transparent 75%, #000 75%);
           background-size: 20px 20px;
           background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
           background-color: #000;
         }
       `}</style>
    </div>
  );
};

export default App;
