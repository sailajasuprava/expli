import { useState } from "react";
import axiosInstance from "../../../network/axiosInstance";
import { FaArrowRight } from "react-icons/fa";
import {
  LayoutDashboard,
  UploadCloud,
  FolderKanban,
  Star,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function AIMemeGenerator() {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uid, setUid] = useState("");
  // const [uid, setUid] = useState("cmdrhmmv703yxzd0znr6bd33q");
  const [url, setUrl] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedTone, setSelectedTone] = useState("");

  const [activeItem, setActiveItem] = useState("Tools");

  const sidebarItems = [
    { label: "Tools", icon: <LayoutDashboard size={20} /> },
    { label: "Uploads", icon: <UploadCloud size={20} /> },
    { label: "Projects", icon: <FolderKanban size={20} /> },
    { label: "Explore", icon: <Star size={20} />, premium: true },
    // { label: "Account", icon: <User size={20} /> },
  ];

  const handleMemeGenerate = async () => {
    setShowModal(true);
  };

  const handleToneClick = (tone) => {
    setSelectedTone(tone);
  };

  const handleGoClick = async () => {
    setShowModal(false);
    setIsLoading(true);
    try {
      const response = await axiosInstance.post(
        "http://localhost:8000/api/aiMemeGenerator",
        {
          topic: inputText,
          template: selectedTone,
        }
      );

      const newUid = response?.data?.content;
      console.log("uid-client", newUid);
      setUid(newUid);

      // Create new storage entry
      const newEntry = {
        uid: newUid,
        text: inputText,
        createdAt: new Date().toISOString(),
      };

      // Retrieve existing stored items or create new array
      const existingEntries =
        JSON.parse(localStorage.getItem("memeHistory")) || [];

      // Append new entry
      const updatedEntries = [...existingEntries, newEntry];

      // Save back to localStorage
      localStorage.setItem("memeHistory", JSON.stringify(updatedEntries));

      console.log("Updated meme history:", updatedEntries);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  const getMeme = async () => {
    console.log("getMeme");
    setIsLoading(true);
    try {
      const response = await axiosInstance.post(
        "http://localhost:8000/api/aiMemeGenerator/get-meme",
        {
          uid,
        }
      );
      console.log(response);
      setUrl(response?.data?.content);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pl-16 relative flex bg-gradient-to-br from-minimal-background via-minimal-dark-100 to-minimal-dark-200 text-white">
      {/* Sidebar */}
      <div className="w-16 bg-black/40 border-r border-gray-800 flex flex-col items-center py-6 gap-8">
        {sidebarItems.map((item) => (
          <button
            key={item.label}
            onClick={() => setActiveItem(item.label)}
            className={`flex flex-col items-center gap-2 relative transition-all ${
              activeItem === item.label ? "text-teal-400" : "text-gray-300"
            } hover:text-white`}
          >
            <div
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${
                activeItem === item.label ? "bg-teal-500/20" : "bg-gray-700/30"
              } hover:bg-teal-500/30`}
            >
              {item.icon}
            </div>
            <span className="text-xs whitespace-nowrap">{item.label}</span>

            {item.premium && (
              <span className="absolute -top-2 right-0 bg-yellow-500 text-black text-[9px] px-[5px] rounded font-bold">
                PRO
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 relative z-10">
        {/* Header */}
        <div className="relative text-center py-6">
          <div className="inline-block">
            <h1
              className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-[#23b5b5] to-white bg-clip-text text-transparent mb-4"
              style={{ backgroundSize: "200% auto" }}
            >
              Text to Meme Generator
            </h1>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#23b5b5] to-transparent rounded-full"></div>
          </div>
        </div>

        {/* Input Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-300">
            Describe your meme!
          </h2>

          <div className="relative group">
            {/* Glow effect on hover */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#23b5b5] to-[#1a8f8f] rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500"></div>

            <textarea
              value={inputText}
              rows={3}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="What's on your mind? Type it out or attach a link — we'll meme it!"
              className="relative w-full bg-gray-800 border border-gray-700 hover:border-[#23b5b5]/50 focus:border-[#23b5b5] rounded-2xl px-4 py-3 text-white placeholder-gray-500 resize-none transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#23b5b5]/20"
            />

            {/* Character count indicator */}
            {inputText && (
              <div className="absolute bottom-4 right-6 text-xs text-gray-600">
                {inputText.length} characters
              </div>
            )}
          </div>

          {/* Input Actions */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-500">
              {inputText && (
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-[#23b5b5]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Ready to generate
                </span>
              )}
            </div>

            <button
              disabled={!inputText}
              onClick={handleMemeGenerate}
              className={`group relative px-4 py-2 rounded-xl font-semibold transition-all duration-300 transform overflow-hidden bg-gradient-to-r from-[#23b5b5] to-[#1a8f8f] hover:from-[#1a8f8f] hover:to-[#23b5b5] shadow-lg shadow-[#23b5b5]/30 hover:shadow-xl hover:shadow-[#23b5b5]/50 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              <span className="relative z-10 flex items-center gap-2">
                Generate Meme
                <FaArrowRight />
              </span>
            </button>
          </div>

          {showModal && (
            <div className="fixed inset-0 text-white bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gray-700  px-8 py-8 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-200 scale-100">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold  mb-2">
                    Choose Your Meme Style
                  </h2>
                  <p className=" text-sm">
                    Select a template to bring your idea to life
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  {[
                    {
                      name: "Random",
                      image: "/images/random.jpg",
                    },
                    {
                      name: "Drake Hotline Bling",
                      image: "/images/drake.jpg",
                    },
                    {
                      name: "Galaxy Brain",
                      image: "/images/galaxybrain.jpg",
                    },
                    {
                      name: "Two Buttons",
                      image: "/images/twobuttons.jpg",
                    },
                    {
                      name: "Gru's Plan",
                      image: "/images/grusplan.jpg",
                    },
                    {
                      name: "Tuxedo Winnie the Pooh",
                      image: "/images/pooh.jpg",
                    },
                    {
                      name: "Is This a Pigeon",
                      image: "/images/pigeon.jpg",
                    },
                    {
                      name: "Panik Kalm Panik",
                      image: "/images/panik.jpg",
                    },
                  ].map((tone) => (
                    <button
                      key={tone.name}
                      onClick={() => handleToneClick(tone.name)}
                      className={`group relative p-4 text-white rounded-xl border-2 transition-all duration-200 text-left hover:scale-105 ${
                        selectedTone === tone.name
                          ? "border-teal-500 bg-gray-700 shadow-lg shadow-teal-200"
                          : "border-gray-200 bg-gray-800 text-white hover:border-gray-300 hover:bg-gray-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={tone.image}
                          alt={tone.name}
                          className="w-12 h-12 rounded-lg object-cover group-hover:scale-110 transition-transform duration-200 shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium text-sm leading-tight text-white`}
                          >
                            {tone.name}
                          </p>
                        </div>
                        {selectedTone === tone.name && (
                          <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 rounded-xl border border-gray-300  font-medium hover:bg-gray-900 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGoClick}
                    disabled={!selectedTone}
                    className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      selectedTone
                        ? "bg-gradient-to-r from-[#23b5b5] to-[#1a8f8f] hover:from-[#1a8f8f] hover:to-[#23b5b5] shadow-lg shadow-[#23b5b5]/30 hover:shadow-xl hover:shadow-[#23b5b5]/50 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Create Meme
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Get Meme Section */}
          {uid && (
            <div className="flex flex-col items-center gap-8 mt-16">
              <div className="relative group">
                <div className="absolute -inset-1 rounded-full blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                <button
                  onClick={getMeme}
                  disabled={!uid || isLoading}
                  className="relative px-4 py-2 rounded-xl font-semibold transition-all duration-300 transform overflow-hidden bg-gradient-to-r from-[#23b5b5] to-[#1a8f8f] hover:from-[#1a8f8f] hover:to-[#23b5b5] shadow-lg shadow-[#23b5b5]/30 hover:shadow-xl hover:shadow-[#23b5b5]/50 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-3">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Generating Your Meme...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Get Your Meme
                      <FaArrowRight />
                    </span>
                  )}
                </button>
              </div>

              {url && (
                <div className="w-full max-w-xs">
                  <div className="relative group">
                    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-3xl border-2 border-gray-700">
                      <div className="bg-black rounded-2xl overflow-hidden mb-6">
                        <img
                          src={url}
                          alt="Generated meme gif"
                          className="w-full h-auto"
                        />
                      </div>
                      <a href={url} download="my-meme.gif">
                        <button className="w-full bg-gradient-to-r from-[#23b5b5] to-[#1a8f8f] hover:from-[#1a8f8f] hover:to-[#23b5b5] text-white font-semibold px-6 py-4 rounded-xl shadow-lg shadow-[#23b5b5]/30 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          Download Your Meme
                        </button>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Meme Preset Suggestions */}
        <div className="mt-12 pb-12">
          <h2 className="text-center text-2xl font-semibold mb-6 text-gray-300">
            Try these meme descriptions
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                title: "Relatable Work Meme",
                desc: "When you open your laptop Monday morning and it sighs louder than you.",
                text: "When you open your laptop Monday morning and it sighs louder than you.",
              },
              {
                title: "Pet Chaos Meme",
                desc: "Cat steals your chair the moment you stand up.",
                text: "Cat steals your chair the moment you stand up.",
              },
              {
                title: "Coding Struggle Meme",
                desc: "Me fixing one bug and accidentally creating seven more.",
                text: "Me fixing one bug and accidentally creating seven more.",
              },
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setInputText(preset.text)}
                className="text-left px-4 py-2 rounded-xl bg-gray-800/50 border border-gray-700 
                     hover:border-[#23b5b5] hover:bg-gray-800 transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-white">
                    {preset.title}
                  </span>
                </div>
                <p className="text-sm text-gray-400 leading-snug">
                  {preset.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #23b5b5;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #1a8f8f;
        }
      `}</style>
    </div>
  );
}
