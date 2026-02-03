import { useEffect, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import axios from "axios";
import { GrCopy } from "react-icons/gr";
import { FiPlus } from "react-icons/fi";
import { HiOutlineArrowUp } from "react-icons/hi2";
import { transData, summaryData } from "./text";

const Accordion = (props) => {
  const { token, setToken } = props;
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("");
  const [videoId, setVideoId] = useState(null);
  const [videoTitle, setVideoTitle] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [question, setQuestion] = useState("questionquestionquestion");
  const [answer, setAnswer] = useState(
    "setAnswersetAnswers etAnswers etAnswersetAnswer setAnswersetA nswer setAnswe rsetAnswer setAnswer setAnsw ersetAnswer setAnswe rsetAnswe rsetAnswer",
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function getVideoId() {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("v");
    }

    const id = getVideoId();
    setVideoId(id);
  }, []);

  useEffect(() => {
    function fetchVideoTitle() {
      const titleElement = document.querySelector(
        "h1.style-scope.ytd-watch-metadata yt-formatted-string",
      );

      if (titleElement) {
        setVideoTitle(titleElement.title);
      } else {
        setTimeout(fetchVideoTitle, 500);
      }
    }
    fetchVideoTitle();
  }, []);

  async function handleQuestion() {
    try {
      const transcriptText = transcript.map((t) => t.text).join(" ");
      setLoading(true);

      const response = await axios.post(
        "http://localhost:8000/api/ytSummarize/answerTranscript",
        // "https://api-pf6diz22ka-uc.a.run.app/api/ytSummarize/answerTranscript",
        { transcriptText, question },
      );
      console.log(response);
      setAnswer(response?.data?.content);
    } catch (error) {
      console.log(error);
      setError(error.response?.data?.message || "Failed to generate answer.");
    } finally {
      setLoading(false);
    }
  }

  // useEffect(() => {
  //   const getTranscript = async () => {
  //     if (!videoId) return;
  //     if (activeTab !== "transcript") return;

  //     setLoading(true);
  //     setError("");
  //     setTranscript("");

  //     try {
  //       const response = await axios.post(
  //         "https://api-pf6diz22ka-uc.a.run.app/api/ytSummarize/transcript",
  //         // "http://localhost:8000/api/ytSummarize/transcript",
  //         { videoId }
  //       );
  //       console.log(response);
  //       let content = response.data?.content;
  //       // content = content.replaceAll("&amp;#39;", "'");
  //       // content = content.replaceAll("&amp;quot;", "'");

  //       setTranscript(content || "No transcript found.");
  //     } catch (err) {
  //       console.log(err);
  //       setError(err.response?.data?.message || "Failed to fetch transcript.");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   const getSummary = async () => {
  //     if (!videoId) return;
  //     if (activeTab !== "summary") return;

  //     setLoading(true);
  //     setError("");
  //     setSummary("");

  //     try {
  //       const response = await axios.post(
  //         "https://api-pf6diz22ka-uc.a.run.app/api/ytSummarize/summary",
  //         // "http://localhost:8000/api/ytSummarize/transcript",
  //         { videoId }
  //       );
  //       console.log(response);
  //       let content = response.data?.content;
  //       // content = content.replaceAll("&amp;#39;", "'");
  //       // content = content.replaceAll("&amp;quot;", "'");

  //       setSummary(content || "No summary found.");
  //     } catch (err) {
  //       console.log(err);
  //       setError(err.response?.data?.message || "Failed to generate summary.");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   if (activeTab === "summary") {
  //     getSummary();
  //   } else {
  //     getTranscript();
  //   }
  // }, [videoId, activeTab]);

  // --- REMOVE this whole useEffect that auto-fetches ---
  // useEffect(() => { ... }, [videoId, activeTab]);

  // ✅ Instead define two functions

  const getTranscript = async () => {
    if (!videoId) return;

    setLoading(true);
    setError("");
    setTranscript("");
    try {
      // const response = await axios.post(
      //   "http://localhost:8000/api/ytSummarize/transcript",
      //   // "https://api-pf6diz22ka-uc.a.run.app/api/ytSummarize/transcript",
      //   { videoId },
      // );
      // console.log(response);
      setTranscript(transData);
      // setTranscript(response.data?.content || "No transcript found.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch transcript.");
    } finally {
      setLoading(false);
    }
  };

  const getSummary = async () => {
    if (!videoId) return;
    setLoading(true);
    setError("");
    setSummary("");
    try {
      // const response = await axios.post(
      //   "http://localhost:8000/api/ytSummarize/summary",
      //   // "https://api-pf6diz22ka-uc.a.run.app/api/ytSummarize/summary",
      //   { videoId },
      // );

      // console.log(response);
      setSummary(summaryData);
      // setSummary(response.data?.content || "No summary found.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate summary.");
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handleCopy = () => {
    const fullText = transcript.map((item) => item.text).join(" ");
    navigator.clipboard
      .writeText(fullText)
      .then(() => alert("Transcript copied to clipboard!"))
      .catch(() => alert("Failed to copy."));
  };

  const handleCopySummary = () => {
    const fullText = summary.map((item) => item.summary).join(" ");
    navigator.clipboard
      .writeText(fullText)
      .then(() => alert("Summary copied to clipboard!"))
      .catch(() => alert("Failed to copy."));
  };

  const cleanText = (text) => {
    return text
      .replaceAll("&amp;#39;", "'")
      .replaceAll("&amp;quot;", '"')
      .replaceAll("&#39;", "'")
      .replaceAll("&quot;", '"');
  };

  return (
    <div className="py-2 w-full">
      <button
        onClick={() => setAccordionOpen(!accordionOpen)}
        className="flex justify-between w-full items-center !p-3"
      >
        <div className="flex flex-row justify-center items-center gap-4">
          <img
            className={`!h-[20px] transition-all duration-500 ${
              accordionOpen && "rotate-[360deg]"
            }`}
            src="https://explified-home.web.app/assets/explified_logo-6aolyOfR.png"
            alt=""
          />
          <span className="text-[16px]">YT Summarizer</span>
          {token && (
            <button
              onClick={() => {
                chrome.storage.sync.remove("auth_token", () => {
                  console.log("User logged out.");
                  setToken(null);
                });
              }}
              className="text-lg text-[#23b5b5] hover:underline"
            >
              Log Out
            </button>
          )}
        </div>

        <div className="!text-[13px] !transitions-all !duration-300">
          {accordionOpen ? <FaChevronUp /> : <FaChevronDown />}
        </div>
      </button>

      <div
        className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
          accordionOpen
            ? "grid-rows-[1fr] opacity-100 !py-4"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        {token ? (
          <div className="w-full relative overflow-hidden flex flex-col  gap-4 items-center">
            <div className="w-[80%] flex px-4 justify-center rounded-lg overflow-hidden mt-4 gap-4 text-2xl">
              <button
                onClick={() => {
                  setActiveTab("transcript");
                  getTranscript();
                }}
                className={`w-full px-6 py-4 rounded-md transition-all duration-300 hover:opacity-70 shadow-md bg-gradient-to-b from-teal-500 to-teal-700 
      ${activeTab === "transcript" ? "opacity-70" : ""}`}
              >
                Transcript
              </button>
              <button
                onClick={() => {
                  setActiveTab("summary");
                  getSummary();
                }}
                className={`w-full px-6 py-4 rounded-md transition-all duration-300 hover:opacity-70 shadow-md bg-gradient-to-b from-teal-500 to-teal-700 
      ${activeTab === "summary" ? "opacity-70" : ""}`}
              >
                Summarize
              </button>
            </div>
            {/* Video Title Section */}
            <div className="mt-8 px-4 w-full text-center">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md bg-clip-text">
                {videoTitle}
              </h1>
              <div className="h-1 w-24 bg-gradient-to-r from-transparent via-teal-500 to-transparent mx-auto mt-2"></div>
            </div>
            {/* <div className="text-3xl !px-2 text-center mt-4">{videoTitle}</div> */}

            {loading && <p className="font-thin text-2xl mt-4">Loading...</p>}
            {error && (
              <p className="text-red-500 font-thin text-2xl mt-4">{error}</p>
            )}
            {activeTab === "transcript" && transcript && (
              // <>
              //   <div className="!p-4 space-y-4 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-[#23b5b5] scrollbar-track-transparent">
              //     {transcript.map((item, index) => (
              //       <div key={index} className="flex items-start gap-2 text-xl">
              //         <span className="text-blue-500 font-mono min-w-[50px]">
              //           {formatTimestamp(item.timestamp)}
              //         </span>
              //         <p className="text-gray-200">
              //           {item.text
              //             .replaceAll("&amp;#39;", "'")
              //             .replaceAll("&amp;quot;", "'")
              //             .replaceAll("&#39;", "'")}
              //         </p>
              //       </div>
              //     ))}
              //   </div>
              //   <div className="flex w-full justify-end mt-3 !px-4">
              //     <button
              //       onClick={() => {
              //         navigator.clipboard
              //           .writeText(transcript)
              //           .then(() => alert("Transcript copied to clipboard!"))
              //           .catch(() => alert("Failed to copy transcript."));
              //       }}
              //     >
              //       <GrCopy size={20} color="white" />
              //     </button>
              //   </div>
              // </>

              <div className="flex flex-col w-full bg-[#0f0f0f] rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
                {/* Scrollable List */}
                <div className="p-2 space-y-1 max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#23b5b5] scrollbar-track-transparent">
                  {transcript.map((item, index) => (
                    <div
                      key={index}
                      className="group flex items-start gap-4 p-3 rounded-xl hover:bg-[#23b5b5]/5 transition-all duration-200 border border-transparent hover:border-[#23b5b5]/10"
                    >
                      {/* Timestamp Badge */}
                      <span className="text-[#3ea6ff] font-mono bg-[#3ea6ff]/10 px-2 py-0.5 rounded-md min-w-[55px] text-center mt-1">
                        {formatTimestamp(item.timestamp)}
                      </span>

                      {/* Content Body */}
                      <div className="flex-1">
                        <p className="text-gray-300 text-lg leading-relaxed font-normal selection:bg-[#23b5b5]/30">
                          {cleanText(item.text)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/*  Copy Action */}
                <div className="flex w-full justify-end mt-3 !px-4">
                  <button
                    onClick={handleCopy}
                    className="p-2 hover:bg-gray-800 rounded-full transition-all duration-200 text-gray-400 hover:text-[#23b5b5] active:scale-90"
                    title="Copy full transcript"
                  >
                    <GrCopy size={18} />
                  </button>
                </div>
              </div>
            )}
            {activeTab === "summary" && summary && (
              <div className="flex flex-col w-full bg-[#0f0f0f] rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
                <div className="!p-4 space-y-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-[#23b5b5] scrollbar-track-transparent">
                  <div className="space-y-6">
                    {summary?.map((item, index) => (
                      <div
                        key={index}
                        className="bg-[#1f1f1f] text-white p-4 rounded-lg shadow"
                      >
                        {/* <p className=" text-gray-400 mb-2">
                          Time: {item.timeRange}
                        </p> */}
                        <p className="text-gray-300 text-lg leading-relaxed font-normal selection:bg-[#23b5b5]/30">
                          {cleanText(item.summary)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex w-full justify-end mt-3 !px-4">
                  <button
                    // onClick={() => {
                    //   navigator.clipboard
                    //     .writeText(summary)
                    //     .then(() => alert("Summary copied to clipboard!"))
                    //     .catch(() => alert("Failed to copy summary."));
                    // }}
                    onClick={handleCopySummary}
                    // className="text-sm px-4 py-1 rounded-full bg-[#23b5b5] text-black font-medium hover:bg-[#1daaaa] transition-colors duration-200"
                    className="p-2 hover:bg-gray-800 rounded-full transition-all duration-200 text-gray-400 hover:text-[#23b5b5] active:scale-90"
                    title="Copy full transcript"
                  >
                    <GrCopy size={18} />
                  </button>
                </div>
              </div>
            )}

            {(summary || transcript) && (
              <>
                <div
                  className={`w-full ${question && answer ? "!p-3" : "!p-0"}`}
                >
                  {question && (
                    <div className="w-full flex justify-end !mb-2">
                      <div className="max-w-[80%] !bg-gray-800 text-white text-lg !rounded-md !p-3">
                        {question}
                      </div>
                    </div>
                  )}

                  {answer && (
                    <div className="w-full flex justify-start">
                      <div className="max-w-[80%] !bg-gray-800 text-white text-lg !rounded-md !p-3">
                        {answer}
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Field */}
                <div className="w-[90%] mt-4 !px-4 !py-3 !border !border-[#23b5b5] !shadow-[0_0_25px_rgba(35,181,181,0.4)] !rounded-full flex justify-between items-center">
                  <button
                    type="button"
                    className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 backdrop-blur-sm rounded-full transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-md hover:shadow-lg"
                  >
                    <FiPlus size={20} />
                  </button>

                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Any Questions ?"
                    className="w-full text-white py-2 focus:outline-none"
                  />

                  <button
                    onClick={handleQuestion}
                    disabled={loading || !question}
                    className={`flex items-center justify-center w-12 h-10 rounded-full transition-all duration-300 shadow-lg bg-gradient-to-br from-teal-400 to-teal-600 text-white hover:from-[#2cc0c0] hover:shadow-xl shadow-[#23b5b5]/30 hover:shadow-[#23b5b5]/50 active:scale-90 cursor-pointer hover:rotate-3`}
                  >
                    <HiOutlineArrowUp
                      size={18}
                      className={`${loading ? "opacity-60" : ""}`}
                    />
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center w-full overflow-hidden">
            <a href="https://explified-home.web.app/login" target="_blank">
              <button className="text-xl cursor-pointer px-4 py-1 rounded border border-[#23b5b5]">
                Login
              </button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Accordion;
