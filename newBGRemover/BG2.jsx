import { useState, useRef, useEffect } from "react";
import "./BGRemover.css";
import {
  Wand2,
  LayoutDashboard,
  Undo2,
  Redo2,
  Pilcrow,
  Heading,
} from "lucide-react";

import {
  Upload,
  Sparkles,
  Download,
  X,
  Image as ImageIcon,
  Type,
} from "lucide-react";
import {
  backgroundThumbnails,
  imageThumbnails,
  colorOptions,
} from "../../../../public/bg-remover";

export default function BackgroundRemover() {
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const [isCutoutMode, setIsCutoutMode] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [isErasing, setIsErasing] = useState(true); // Erase vs Restore
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const previewCanvasRef = useRef(null);

  const [isBackgroundMode, setIsBackgroundMode] = useState(false);
  const [backgroundType, setBackgroundType] = useState("magic"); // magic | photo | color
  const [selectedBackground, setSelectedBackground] = useState(null);

  const [isEffectsMode, setIsEffectsMode] = useState(false);
  const [blurEnabled, setBlurEnabled] = useState(false);
  const [blurAmount, setBlurAmount] = useState(10); // default blur level

  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const [isDesignMode, setIsDesignMode] = useState(false);
  const [textElements, setTextElements] = useState([]);
  const [activeTextId, setActiveTextId] = useState(null); // which one is being edited
  const textRefs = useRef({});
  const [hideTextDuringExport, setHideTextDuringExport] = useState(false);

  useEffect(() => {
    if (!processedImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctxRef.current = ctx;

    const img = new Image();
    img.src = processedImage;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(img, 0, 0);
    };
  }, [processedImage]);

  useEffect(() => {
    if (!preview || processedImage) return; // only show preview when no cutout yet

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctxRef.current = ctx;

    const img = new Image();
    img.src = preview;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  }, [preview, processedImage]);

  useEffect(() => {
    if (!isCutoutMode) return;

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const previewCanvas = previewCanvasRef.current;
    const previewCtx = previewCanvas.getContext("2d");

    let drawing = false;

    // ✅ Make preview canvas match main canvas size
    previewCanvas.width = canvas.width;
    previewCanvas.height = canvas.height;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const startDrawing = (e) => {
      saveCanvasState(); // save before editing
      drawing = true;
      draw(e);
    };

    const stopDrawing = () => {
      drawing = false;
      ctx.beginPath();
      previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    };

    const draw = (e) => {
      const { x, y } = getPos(e);

      // ✅ STEP 4 — Always update red preview circle
      previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      previewCtx.beginPath();
      previewCtx.arc(x, y, brushSize, 0, Math.PI * 2);
      previewCtx.fillStyle = "rgba(255, 0, 0, 0.6)";
      previewCtx.fill();

      if (!drawing) return;

      // ✅ erase / restore on main canvas
      ctx.globalCompositeOperation = isErasing
        ? "destination-out"
        : "source-over";

      ctx.beginPath();
      ctx.arc(x, y, brushSize, 0, Math.PI * 2);
      ctx.fill();
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mousemove", draw);

    // ✅ STEP 5 — Hide brush when leaving canvas
    canvas.addEventListener("mouseleave", () => {
      previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    });

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseleave", () =>
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height)
      );
    };
  }, [isCutoutMode, brushSize, isErasing]);

  useEffect(() => {
    if (isBackgroundMode && selectedBackground) {
      if (selectedBackground.startsWith("#")) {
        applyColorBackground(selectedBackground);
      } else {
        applyImageBackground(selectedBackground);
      }
    }
  }, [isBackgroundMode]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // If user clicked inside any editable text box, do nothing
      if (e.target.closest(".editable-text")) {
        return;
      }

      // If user clicked inside the design panel (toolbar), also do nothing
      if (e.target.closest(".design-panel")) {
        return;
      }

      // Otherwise close edit mode
      setActiveTextId(null);
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const removeBackground = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append("size", "auto");
    formData.append("image_file", selectedFile);

    try {
      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": import.meta.env.VITE_REMOVE_BG_API_KEY,
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
      setIsProcessing(false);
    }
  };

  const applyImageBackground = (imgUrl) => {
    saveCanvasState();
    setSelectedBackground(imgUrl); // ✅ store selection
    redrawCanvas(imgUrl).catch((e) => console.error(e));
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const bgImg = new Image();
    bgImg.src = imgUrl;

    bgImg.onload = () => {
      ctx.globalCompositeOperation = "destination-over";
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    };
  };

  const applyColorBackground = (color) => {
    saveCanvasState();
    setSelectedBackground(color); // ✅ store selection
    redrawCanvas(color).catch((e) => console.error(e));
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  };

  // Save current canvas state to undo stack
  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const snapshot = {
      image: canvas.toDataURL("image/png"),
      text: JSON.parse(JSON.stringify(textElements)), // deep clone
    };
    // const dataUrl = canvas.toDataURL("image/png");
    setUndoStack((prev) => [...prev, snapshot]);
    setRedoStack([]); // clear redo after new action
  };

  const restoreCanvasFromState = (state) => {
    const { image, text } = state;

    // restore text
    setTextElements(text);

    // restore canvas image
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.src = image;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  // Undo the last change
  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const last = undoStack[undoStack.length - 1];

    // move current state to redo
    setRedoStack((prev) => [
      ...prev,
      {
        image: canvasRef.current.toDataURL("image/png"),
        text: JSON.parse(JSON.stringify(textElements)),
      },
    ]);

    restoreCanvasFromState(last);
    setUndoStack((prev) => prev.slice(0, -1));
  };
  // Redo the previously undone change
  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];

    // Save current state (same format as undo uses)
    setUndoStack((prev) => [
      ...prev,
      {
        image: canvasRef.current.toDataURL("image/png"),
        text: JSON.parse(JSON.stringify(textElements)),
      },
    ]);

    // Remove from redo stack
    setRedoStack((prev) => prev.slice(0, -1));

    // Restore full state (image + text)
    restoreCanvasFromState(nextState);
  };

  // promise loader for images (useful to avoid race conditions)
  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.crossOrigin = "anonymous"; // safe when possible
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });

  const redrawCanvas = async (bgOption = selectedBackground) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx || !processedImage) return;

    try {
      // load the cutout image and optional background image (if image-based)
      const [cutoutImg, bgImg] = await Promise.all([
        loadImage(processedImage),
        bgOption && !bgOption.startsWith("#")
          ? loadImage(bgOption)
          : Promise.resolve(null),
      ]);

      // ensure canvas matches cutout image resolution
      if (!cutoutImg) return;
      canvas.width = cutoutImg.width;
      canvas.height = cutoutImg.height;

      // clear and draw background first (ALWAYS)
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
      if (bgOption) {
        if (bgOption.startsWith("#")) {
          ctx.fillStyle = bgOption;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (bgImg) {
          // draw bg image stretched to fill canvas
          ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        }
      } else {
        // no bg — keep transparent or white if desired
        // ctx.clearRect already left it transparent
      }

      // draw cutout image on TOP of background
      ctx.drawImage(cutoutImg, 0, 0, canvas.width, canvas.height);

      ctx.restore();
    } catch (err) {
      console.error("redrawCanvas error:", err);
    }
  };

  const applyEffectsToCanvas = () => {
    saveCanvasState();
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    if (!processedImage) return;

    const img = new Image();
    img.src = processedImage;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Step 1 → Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Step 2 → Apply background FIRST
      if (selectedBackground) {
        if (selectedBackground.startsWith("#")) {
          // Color background
          ctx.fillStyle = selectedBackground;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          // Image background
          const bg = new Image();
          bg.src = selectedBackground;

          bg.onload = () => {
            // ✅ If blur is ON → apply CSS canvas filter
            if (blurEnabled) {
              ctx.filter = `blur(${blurAmount}px)`;
            } else {
              ctx.filter = "none";
            }

            ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
            ctx.filter = "none"; // reset before drawing cutout

            // Draw cutout image on top
            ctx.drawImage(img, 0, 0);
          };

          return;
        }
      }

      // If no background -> just draw foreground
      ctx.drawImage(img, 0, 0);
    };
  };

  const downloadImage = async () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    setHideTextDuringExport(true);
    // Redraw the image first (if needed)
    await redrawCanvas(); // Ensure the base image is there (might be async, so better to directly redraw here or ensure ready)

    // Draw the text elements on the canvas
    drawTextElements(ctx);
    await new Promise((res) => setTimeout(res, 50));
    const link = document.createElement("a");
    link.download = "cutout.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    setHideTextDuringExport(false);
    redrawCanvas();
  };

  const reset = () => {
    setSelectedFile(null);
    setPreview(null);
    setProcessedImage(null);
    setError(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addTextElement = (type) => {
    const defaultStyles = {
      heading: { fontSize: "32px", fontWeight: "bold", text: "Add a heading" },
      subheading: {
        fontSize: "24px",
        fontWeight: "600",
        text: "Add a subheading",
      },
      paragraph: {
        fontSize: "16px",
        fontWeight: "normal",
        text: "Add a paragraph",
      },
    };

    const style = defaultStyles[type];
    const id = Date.now();

    const newText = {
      id,
      type,
      text: style.text,
      x: 100,
      y: 100,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      isDragging: false,
    };

    setTextElements((prev) => [...prev, newText]);
    setActiveTextId(id); // start in edit mode

    setTimeout(() => {
      const el = document.querySelector(`[data-text-id="${id}"]`);
      if (el) {
        el.focus();
        placeCaretAtEnd(el);
      }
    }, 50);
  };

  const handleTextChange = (id, newText) => {
    const el = textRefs.current[id];
    let selectionStart = 0;
    let selectionEnd = 0;

    if (el && window.getSelection) {
      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(el);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        selectionStart = preSelectionRange.toString().length;

        preSelectionRange.setEnd(range.endContainer, range.endOffset);
        selectionEnd = preSelectionRange.toString().length;
      }
    }

    setTextElements((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text: newText } : t))
    );

    // After state update, restore caret position
    setTimeout(() => {
      if (!el) return;
      el.focus();

      if (window.getSelection) {
        const sel = window.getSelection();
        const range = document.createRange();

        // Set to start same node and offset approximated by text length difference
        let charIndex = 0;
        let nodeStack = [el];
        let node;
        let foundStart = false;
        let stop = false;

        while (!stop && (node = nodeStack.pop())) {
          if (node.nodeType === 3) {
            const nextCharIndex = charIndex + node.length;
            if (
              !foundStart &&
              selectionStart >= charIndex &&
              selectionStart <= nextCharIndex
            ) {
              range.setStart(node, selectionStart - charIndex);
              foundStart = true;
            }
            if (
              foundStart &&
              selectionEnd >= charIndex &&
              selectionEnd <= nextCharIndex
            ) {
              range.setEnd(node, selectionEnd - charIndex);
              stop = true;
            }
            charIndex = nextCharIndex;
          } else {
            let i = node.childNodes.length;
            while (i--) {
              nodeStack.push(node.childNodes[i]);
            }
          }
        }
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 0);
  };

  const drawTextElements = (ctx) => {
    const { scaleX, scaleY } = getCanvasScale();

    textElements.forEach((t) => {
      ctx.font = `${t.fontWeight} ${parseFloat(t.fontSize) * scaleY}px Arial`;
      ctx.fillStyle = "white";
      ctx.textBaseline = "top";

      ctx.fillText(t.text, t.x * scaleX, t.y * scaleY);
    });
  };

  const handleMouseDown = (e, id) => {
    setActiveTextId(id); // also enter edit mode when clicked

    const element = textElements.find((t) => t.id === id);
    if (!element) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = element.x;
    const initialY = element.y;

    const handleMove = (ev) => {
      const { scaleX, scaleY } = getCanvasScale();

      const dx = (ev.clientX - startX) * scaleX;
      const dy = (ev.clientY - startY) * scaleY;

      setTextElements((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, x: initialX + dx, y: initialY + dy } : t
        )
      );
    };

    const stopDrag = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", stopDrag);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", stopDrag);
  };

  // Put this inside the component
  const placeCaretAtEnd = (el) => {
    if (!el) return;

    el.focus();

    const range = document.createRange();
    const sel = window.getSelection();

    // Select all content
    range.selectNodeContents(el);
    // Collapse to end
    range.collapse(false);

    // Clear any existing selections and add new range
    sel.removeAllRanges();
    sel.addRange(range);
  };

  const getCanvasScale = () => {
    const canvas = canvasRef.current;
    if (!canvas) return { scaleX: 1, scaleY: 1 };

    const rect = canvas.getBoundingClientRect();

    return {
      scaleX: canvas.width / rect.width,
      scaleY: canvas.height / rect.height,
    };
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-20 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: "#23b5b5" }}
        ></div>
        <div
          className="absolute bottom-20 right-20 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: "#23b5b5" }}
        ></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
        <div className="max-w-5xl w-full">
          {/* Header */}
          <div className="text-center mb-8 md:mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              Background <span style={{ color: "#23b5b5" }}>Remover</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
              Remove backgrounds instantly with advanced AI. Perfect results in
              seconds.
            </p>
          </div>

          {/* Main Content */}
          {!selectedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className="relative group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="block cursor-pointer">
                <div
                  className={`relative backdrop-blur-2xl rounded-3xl p-12 md:p-20 text-center transition-all duration-300 ${
                    isDragging ? "scale-105" : "hover:scale-[1.02]"
                  }`}
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)",
                    border: isDragging
                      ? "2px solid #23b5b5"
                      : "2px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: isDragging
                      ? "0 0 40px rgba(35, 181, 181, 0.3)"
                      : "0 8px 32px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  <div className="relative mb-8">
                    <div
                      className="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(35, 181, 181, 0.2) 0%, rgba(35, 181, 181, 0.1) 100%)",
                      }}
                    >
                      <Upload
                        className="w-12 h-12"
                        style={{ color: "#23b5b5" }}
                      />
                    </div>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    {isDragging ? "Drop your image here" : "Upload your image"}
                  </h3>
                  <p className="text-gray-400 mb-8 text-base md:text-lg">
                    Drag and drop or click to browse
                  </p>

                  <div
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-black transition-all duration-300 bg-gradient-to-r from-teal-400 to-cyan-400 shadow-md hover:shadow-xl hover:scale-105 backdrop-blur-md"
                    style={{
                      boxShadow: "0 6px 20px rgba(0, 200, 200, 0.3)",
                    }}
                  >
                    <ImageIcon className="w-5 h-5" />
                    Choose File
                  </div>

                  <p className="text-gray-500 text-sm mt-6">
                    Supports: JPG, PNG, WEBP
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Image Display */}
              <div
                className={`relative flex items-center justify-center min-h-96 rounded-2xl overflow-hidden ${
                  processedImage ? "pt-24" : ""
                }`}
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <button
                  onClick={reset}
                  className="absolute top-4 right-4 p-3 rounded-xl backdrop-blur-xl transition-all duration-300 hover:scale-110 z-10"
                  style={{
                    background: "rgba(0, 0, 0, 0.5)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                {/* TOP TOOLBAR (only visible after processing) */}
                {processedImage && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-neutral-800/80 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-lg border border-neutral-700">
                    {/* Cutout */}
                    <button
                      onClick={() => {
                        setIsCutoutMode(true);
                        setIsBackgroundMode(false);
                        setIsEffectsMode(false);
                        setIsDesignMode(false);
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-medium text-sm transition-all ${
                        isCutoutMode
                          ? "bg-neutral-700 text-teal-300"
                          : "text-gray-300 hover:bg-neutral-700/60 hover:text-white"
                      }`}
                    >
                      <Wand2 size={16} />
                      Cutout
                    </button>

                    {/* Background */}
                    <button
                      onClick={() => {
                        setIsCutoutMode(false);
                        setIsBackgroundMode(true);
                        setIsEffectsMode(false);
                        setIsDesignMode(false);
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-medium text-sm transition-all ${
                        isBackgroundMode
                          ? "bg-neutral-700 text-teal-300"
                          : "text-gray-300 hover:bg-neutral-700/60 hover:text-white"
                      }`}
                    >
                      <ImageIcon size={16} />
                      Background
                    </button>

                    {/* Effects */}
                    <button
                      onClick={() => {
                        setIsCutoutMode(false);
                        setIsBackgroundMode(false);
                        setIsEffectsMode(true);
                        setIsDesignMode(false);
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-medium text-sm transition-all ${
                        isEffectsMode
                          ? "bg-neutral-700 text-teal-300"
                          : "text-gray-300 hover:bg-neutral-700/60 hover:text-white"
                      }`}
                    >
                      <Sparkles size={16} />
                      Effects
                    </button>

                    {/* Design */}
                    <button
                      onClick={() => {
                        setIsCutoutMode(false);
                        setIsBackgroundMode(false);
                        setIsEffectsMode(false);
                        setIsDesignMode(true);
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-medium text-sm transition-all ${
                        isDesignMode
                          ? "bg-neutral-700 text-teal-300"
                          : "text-gray-300 hover:bg-neutral-700/60 hover:text-white"
                      }`}
                    >
                      <LayoutDashboard size={16} />
                      Design
                    </button>

                    {/* Divider */}
                    <div className="w-px h-6 bg-neutral-600 mx-1"></div>

                    {/* Undo */}
                    <button
                      onClick={handleUndo}
                      disabled={undoStack.length === 0}
                      className="p-2 rounded-full hover:bg-neutral-700/60 text-gray-300 disabled:opacity-40"
                      title="Undo"
                    >
                      <Undo2 size={18} />
                    </button>

                    {/* Redo */}
                    <button
                      onClick={handleRedo}
                      disabled={redoStack.length === 0}
                      className="p-2 rounded-full hover:bg-neutral-700/60 text-gray-300 disabled:opacity-40"
                      title="Redo"
                    >
                      <Redo2 size={18} />
                    </button>

                    {/* Download */}
                    <button
                      onClick={downloadImage}
                      className="ml-2 bg-teal-500 hover:bg-teal-400 text-black font-semibold px-5 py-2 rounded-full flex items-center gap-1 transition"
                    >
                      <Download size={18} />
                      Download
                    </button>
                  </div>
                )}

                {/* ✅ RIGHT SIDE CUTOUT TOOL PANEL */}
                {isCutoutMode && (
                  <div className="absolute right-4 top-28 w-72 bg-neutral-700 text-gray-300 rounded-2xl shadow-xl p-4 z-40">
                    <h2 className="font-bold mb-4 text-gray-300">
                      Magic Brush
                    </h2>

                    <div className="flex gap-3 mb-4">
                      <button
                        onClick={() => setIsErasing(true)}
                        className={`flex-1 p-3 rounded-xl border ${
                          isErasing
                            ? "border-teal-500/40 bg-teal-500/20 text-teal-300"
                            : "border-neutral-700 bg-neutral-800 hover:bg-neutral-900 text-gray-300"
                        }`}
                      >
                        Erase
                      </button>
                    </div>

                    <div className="mb-4">
                      <p className="font-medium text-gray-700">Brush Size</p>
                      <input
                        type="range"
                        min="5"
                        max="80"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-full accent-teal-400"
                      />
                    </div>

                    <button
                      onClick={() => setIsCutoutMode(false)}
                      className="mt-3 w-full py-2 text-gray-200 font-bold rounded-xl bg-neutral-800 hover:bg-neutral-900 border border-neutral-700 duration-200"
                    >
                      Close
                    </button>
                  </div>
                )}

                {/* ✅ RIGHT SIDE BACKGROUND TOOL PANEL */}
                {isBackgroundMode && (
                  <div className="absolute right-4 top-28 w-80 bg-neutral-700 text-gray-300 rounded-2xl shadow-2xl p-3 z-40">
                    <div className="flex gap-3 mb-2 p-1">
                      <button
                        onClick={() => setBackgroundType("magic")}
                        className={`flex-1 py-2 rounded-lg font-semibold duration-200 transition-colors
        ${
          backgroundType === "magic"
            ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
            : "bg-neutral-800 hover:bg-neutral-900 border border-neutral-700"
        }`}
                      >
                        Magic
                      </button>
                      <button
                        onClick={() => setBackgroundType("photo")}
                        className={`flex-1 py-2 rounded-lg font-semibold duration-200 transition-colors
        ${
          backgroundType === "photo"
            ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
            : "bg-neutral-800 hover:bg-neutral-900 border border-neutral-700"
        }`}
                      >
                        Photo
                      </button>
                      <button
                        onClick={() => setBackgroundType("color")}
                        className={`flex-1 py-2 rounded-lg font-semibold duration-200 transition-colors
        ${
          backgroundType === "color"
            ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
            : "bg-neutral-800 hover:bg-neutral-900 border border-neutral-700"
        }`}
                      >
                        Color
                      </button>
                    </div>

                    {/* ✅ MAGIC / PHOTO GRID */}
                    {backgroundType === "magic" && (
                      <div className="grid grid-cols-3 gap-3 max-h-56 overflow-y-auto p-1 custom-scroll">
                        {backgroundThumbnails.map((thumb, i) => (
                          <img
                            key={i}
                            src={thumb}
                            onClick={() => applyImageBackground(thumb)}
                            className={`w-full h-20 rounded-lg object-cover cursor-pointer transition-transform hover:scale-105
            ${
              selectedBackground === thumb ? "ring-2 ring-teal-400" : "ring-0"
            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* ✅ PHOTO GRID */}
                    {backgroundType === "photo" && (
                      <div className="grid grid-cols-3 gap-3 max-h-56 overflow-y-auto p-1 custom-scroll">
                        {imageThumbnails.map((thumb, i) => (
                          <img
                            key={i}
                            src={thumb}
                            onClick={() => applyImageBackground(thumb)}
                            className={`w-full h-20 rounded-lg object-cover cursor-pointer transition-transform hover:scale-105
            ${
              selectedBackground === thumb ? "ring-2 ring-teal-400" : "ring-0"
            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* ✅ COLOR PICKER GRID */}
                    {backgroundType === "color" && (
                      <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1 custom-scroll">
                        {colorOptions.map((color, i) => (
                          <div
                            key={i}
                            onClick={() => applyColorBackground(color)}
                            className={`w-full h-20 rounded-lg cursor-pointer transition-transform hover:scale-105
            ${
              selectedBackground === color ? "ring-2 ring-teal-400" : "ring-0"
            }`}
                            style={{ background: color }}
                          />
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setIsBackgroundMode(false)}
                      className="mt-4 w-full py-2 rounded-xl bg-neutral-800 hover:bg-neutral-900 border border-neutral-700 duration-200 font-semibold text-gray-200"
                    >
                      Close
                    </button>
                  </div>
                )}

                {isEffectsMode && (
                  <div className="absolute right-4 top-28 w-80 bg-neutral-700 text-gray-300 rounded-2xl shadow-xl p-4 z-40">
                    {/* Toggle Blur */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-semibold text-gray-300">
                        Blur background
                      </span>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={blurEnabled}
                          onChange={() => {
                            setBlurEnabled(!blurEnabled);
                            setTimeout(applyEffectsToCanvas, 20);
                          }}
                        />
                        <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-teal-500 transition"></div>
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-5"></div>
                      </label>
                    </div>

                    {/* Blur Amount Slider */}
                    {blurEnabled && (
                      <>
                        <p className="font-medium mb-1">Blur amount</p>
                        <input
                          type="range"
                          min="0"
                          max="25"
                          value={blurAmount}
                          onChange={(e) => {
                            setBlurAmount(Number(e.target.value));
                            applyEffectsToCanvas();
                          }}
                          className="w-full mb-4"
                        />
                      </>
                    )}

                    <button
                      onClick={() => setIsEffectsMode(false)}
                      className="w-full py-2 mt-2 rounded-xl bg-neutral-800 hover:bg-neutral-900 font-semibold"
                    >
                      Close
                    </button>
                  </div>
                )}

                {isDesignMode && (
                  <div className="design-panel absolute right-4 top-28 w-80 bg-neutral-700 text-gray-300 rounded-2xl shadow-xl p-4 z-40">
                    {/* Add Heading */}
                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-800 transition-colors rounded-2xl">
                      <Heading className="w-7 h-7 text-teal-400" />
                      <button
                        onClick={() => addTextElement("heading")}
                        className="font-medium"
                      >
                        Add a Heading
                      </button>
                    </div>

                    {/* Add Subheading */}
                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-800 transition-colors rounded-2xl">
                      <Type className="w-7 h-7 text-teal-400" />
                      <button
                        onClick={() => addTextElement("subheading")}
                        className="font-medium"
                      >
                        Add a Subheading
                      </button>
                    </div>

                    {/* Add Paragraph */}
                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-800 transition-colors rounded-2xl">
                      <Pilcrow className="w-7 h-7 text-teal-400" />
                      <button
                        onClick={() => addTextElement("paragraph")}
                        className="font-medium"
                      >
                        Add a Paragraph
                      </button>
                    </div>

                    <button
                      onClick={() => setIsDesignMode(false)}
                      className="w-full py-2 mt-2 rounded-xl bg-neutral-800 hover:bg-neutral-900 font-semibold"
                    >
                      Close
                    </button>
                  </div>
                )}

                <div
                  className="relative flex items-center justify-center min-h-96 rounded-2xl overflow-hidden"
                  style={{
                    backgroundImage: processedImage
                      ? "repeating-conic-gradient(rgba(255,255,255,0.05) 0% 25%, rgba(255,255,255,0.02) 0% 50%) 50% / 20px 20px"
                      : "linear-gradient(135deg, rgba(35, 181, 181, 0.05) 0%, rgba(0, 0, 0, 0.2) 100%)",
                  }}
                >
                  {/* ✅ White rounded background BEHIND the processed image */}
                  {processedImage && (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <div
                        className="w-full h-full rounded-3xl"
                        style={{
                          background: "#ffffff",
                          opacity: 0.9,
                        }}
                      ></div>
                    </div>
                  )}

                  {/* ✅ Actual Image */}
                  <div className="relative">
                    <>
                      <canvas
                        ref={canvasRef}
                        className={`relative z-10 ${
                          isDesignMode ? "pointer-events-none" : ""
                        } max-w-full max-h-96 object-contain`}
                      />
                      <canvas
                        ref={previewCanvasRef}
                        className={`absolute inset-0 z-20 pointer-events-none max-w-full max-h-96 object-contain`}
                      />
                      {/* ✅ Render editable text elements */}
                      {!hideTextDuringExport &&
                        textElements.map((t) => (
                          <div
                            ref={(el) => (textRefs.current[t.id] = el)}
                            key={t.id}
                            data-text-id={t.id}
                            contentEditable={activeTextId === t.id}
                            suppressContentEditableWarning
                            spellCheck={false}
                            dir="ltr"
                            onInput={(e) => {
                              saveCanvasState(); // snapshot before writing
                              handleTextChange(
                                t.id,
                                e.currentTarget.textContent
                              );
                            }}
                            onFocus={(e) => {
                              placeCaretAtEnd(e.currentTarget);
                              setActiveTextId(t.id);
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              if (e.target === e.currentTarget)
                                handleMouseDown(e, t.id);
                            }}
                            style={{
                              position: "absolute",
                              top: `${t.y}px`,
                              left: `${t.x}px`,
                              fontSize: t.fontSize,
                              fontWeight: t.fontWeight,
                              color: "white",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              direction: "ltr",
                              textAlign: "left",
                              cursor: activeTextId === t.id ? "text" : "grab",
                              userSelect: "text",
                              outline:
                                activeTextId === t.id
                                  ? "1px dashed teal"
                                  : "none",
                              background:
                                activeTextId === t.id
                                  ? "rgba(0,0,0,0.3)"
                                  : "transparent",
                              minWidth: "50px",
                              zIndex: 50,
                              whiteSpace: "pre-wrap",
                            }}
                            className="editable-text"
                          >
                            {t.text}
                          </div>
                        ))}
                    </>
                  </div>

                  {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center">
                        <div className="relative w-16 h-16 mx-auto mb-4">
                          <div
                            className="absolute inset-0 rounded-full border-4 border-transparent border-t-current animate-spin"
                            style={{ color: "#23b5b5" }}
                          ></div>
                        </div>
                        <p className="text-white font-semibold text-lg">
                          Processing with AI...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm mt-3 text-center font-medium bg-red-100 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <div
                className="inline-flex items-center gap-2 rounded-xl font-semibold text-black transition-all duration-300 bg-gradient-to-r from-teal-400 to-cyan-400 shadow-md hover:shadow-xl hover:scale-105 backdrop-blur-md"
                style={{
                  boxShadow: "0 6px 20px rgba(0, 200, 200, 0.3)",
                }}
              ></div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!processedImage ? (
                  <button
                    onClick={removeBackground}
                    disabled={isProcessing}
                    className="group relative px-8 py-4 rounded-xl font-semibold text-black transition-all duration-300 bg-gradient-to-r from-teal-400 to-cyan-400 shadow-md hover:shadow-xl hover:scale-105 backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 overflow-hidden"
                    style={{
                      boxShadow: "0 6px 20px rgba(0, 200, 200, 0.3)",
                    }}
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    {isProcessing ? (
                      <>
                        <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6" />
                        Remove Background
                      </>
                    )}
                  </button>
                ) : (
                  <></>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
