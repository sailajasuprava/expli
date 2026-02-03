import { useState } from "react";
import { Plus, Check, X, Calendar, Flag, Inbox, Mic } from "lucide-react";
import CalendarPicker from "./components/CalendarPicker";

const priorities = [
  { id: 1, label: "Priority 1", color: "text-red-500", iconColor: "#ef4444" },
  {
    id: 2,
    label: "Priority 2",
    color: "text-orange-500",
    iconColor: "#f97316",
  },
  {
    id: 3,
    label: "Priority 3",
    color: "text-blue-500",
    iconColor: "#3b82f6",
  },
  {
    id: 4,
    label: "Priority 4",
    color: "text-neutral-400",
    iconColor: "#a3a3a3",
  },
];

const demoTasks = [
  {
    id: 1,
    task: "Review design mockups",
    description: "Check the Figma file",
    dueDate: "2 Feb",
    priority: 1,
    completed: false,
  },
  {
    id: 2,
    task: "Team standup",
    description: "",
    dueDate: "Today",
    priority: 4,
    completed: true,
  },
  {
    id: 3,
    task: "Update documentation",
    description: "Add API endpoints",
    dueDate: "5 Feb",
    priority: 2,
    completed: false,
  },
];

function App() {
  const [tasks, setTasks] = useState(demoTasks);
  const [isAdding, setIsAdding] = useState(false);

  const [taskInput, setTaskInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [dueDate, setDueDate] = useState(null);
  const [priority, setPriority] = useState(null);

  // UI Toggles
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  console.log(tasks);

  const handleAddTask = () => {
    console.log("handleAddTask fzd");

    const newTask = {
      id: Date.now(),
      task: taskInput,
      description: descInput,
      dueDate: dueDate || "No date",
      priority: priority || 4,
      completed: false,
    };

    setTasks([...tasks, newTask]);
    resetForm();
  };

  const resetForm = () => {
    setTaskInput("");
    setDescInput("");
    setDueDate(null);
    setPriority(null);
    setIsAdding(false);
    setShowCalendar(false);
    setShowPriority(false);
  };

  const toggleComplete = (id) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  return (
    <div className="w-[400px] min-h-[550px] bg-[#0c0c0c] text-white p-5 flex flex-col font-sans">
      {/* Header Section */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-[#23b5b5] p-1 rounded-md flex items-center justify-center">
            <Check size={18} className="text-black stroke-[3px]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">TaskFlow</h1>
        </div>
        {/* <button className="text-neutral-500 hover:text-white transition-colors">
          <Settings size={22} />
        </button> */}
      </header>

      {/* Toggle Section: Add Task Button OR Quick Add Form */}
      <div className="mb-6">
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full bg-[#181818] border border-neutral-800 hover:border-neutral-700 flex items-center gap-3 px-4 py-3 rounded-xl transition-all group"
          >
            <Plus size={20} className="text-[#23b5b5] group-hover:scale-110" />
            <span className="text-neutral-400">Add task...</span>
          </button>
        ) : (
          <div className="bg-[#181818] border border-neutral-800 rounded-2xl p-4 shadow-2xl relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-neutral-200">
                Quick Add Task
              </h2>
              <button
                onClick={() => setIsAdding(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                autoFocus
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full bg-[#242424] border border-neutral-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#23b5b5] transition-colors"
              />
              <input
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-[#242424] border border-neutral-700 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#23b5b5]"
              />
            </div>

            {/* Selected Tags Section */}
            {(dueDate || priority) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {dueDate && (
                  <div className="flex items-center gap-1.5 bg-orange-100/10 text-orange-200 px-2 py-1 rounded-md text-[11px] border border-orange-200/20">
                    <span>{dueDate}</span>
                    <button onClick={() => setDueDate(null)}>
                      <X size={12} className="hover:text-white" />
                    </button>
                  </div>
                )}
                {priority && (
                  <div className="flex items-center gap-1.5 bg-orange-100/10 text-orange-200 px-2 py-1 rounded-md text-[11px] border border-orange-200/20">
                    <span>P{priority}</span>
                    <button onClick={() => setPriority(null)}>
                      <X size={12} className="hover:text-white" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-4 relative">
              <div className="flex gap-2">
                {/* Due Date Button */}
                <button
                  onClick={() => {
                    setShowCalendar(!showCalendar);
                    setShowPriority(false);
                  }}
                  className={`flex items-center gap-1.5 bg-[#242424] px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${showCalendar ? "text-white border border-[#23b5b5]" : "text-neutral-400 hover:text-white"}`}
                >
                  <Calendar size={14} /> Due date
                </button>

                {/* Priority Button */}
                <button
                  onClick={() => {
                    setShowPriority(!showPriority);
                    setShowCalendar(false);
                  }}
                  className={`flex items-center gap-1.5 bg-[#242424] px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${showPriority ? "text-white border border-[#23b5b5]" : "text-neutral-400 hover:text-white"}`}
                >
                  <Flag size={14} /> Priority
                </button>

                <button className="flex items-center gap-1.5 bg-[#242424] text-neutral-400 px-2.5 py-1.5 rounded-lg text-[11px] hover:text-white">
                  <Inbox size={14} /> Inbox
                </button>
              </div>
              <button className="p-2 border border-[#23b5b5]/30 text-[#23b5b5] rounded-lg">
                <Mic size={16} />
              </button>

              {/* --- CALENDAR POPUP --- */}
              {showCalendar && (
                <CalendarPicker
                  onSelectDate={(formattedDate) => setDueDate(formattedDate)}
                  closeCalendar={() => setShowCalendar(false)}
                />
              )}

              {/* --- PRIORITY POPUP --- */}
              {showPriority && (
                <div className="absolute bottom-12 left-24 w-40 bg-[#1e1e1e] border border-neutral-800 rounded-xl overflow-hidden z-50 shadow-2xl">
                  {priorities.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPriority(p.id);
                        setShowPriority(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-xs hover:bg-[#242424] transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Flag
                          size={14}
                          fill={p.iconColor}
                          color={p.iconColor}
                        />
                        <span className="text-neutral-300 group-hover:text-white">
                          {p.label}
                        </span>
                      </div>
                      {priority === p.id && (
                        <Check size={14} className="text-red-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end items-center gap-4 mt-6">
              <button
                onClick={() => setIsAdding(false)}
                className="text-neutral-500 text-sm font-medium hover:text-neutral-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                className="bg-[#23b5b5] text-black px-5 py-2 rounded-xl text-sm font-bold"
              >
                Add task
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="flex-grow flex flex-col gap-5">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex justify-between items-center group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleComplete(task.id)}
                className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${task.completed ? "bg-[#23b5b5] border-[#23b5b5]" : "border-neutral-700 hover:border-neutral-500"}`}
              >
                {task.completed && (
                  <Check size={14} className="text-black stroke-[3px]" />
                )}
              </button>
              <span
                className={`text-[15px] transition-all ${
                  task.completed
                    ? "line-through text-neutral-600"
                    : "text-neutral-200"
                }`}
              >
                {task.task}
              </span>
            </div>
            <span
              className={`text-xs font-medium ${
                task.completed ? "text-neutral-600" : "text-neutral-500"
              }`}
            >
              {task.dueDate}
            </span>
          </div>
        ))}
      </div>

      {/* Footer Section */}
      <footer className="mt-8 pt-4 border-t border-neutral-900 text-center">
        <button
          className="text-neutral-500 text-sm font-medium hover:text-white transition-colors"
          onClick={() => {
            chrome.tabs.create({
              url: chrome.runtime.getURL("viewer.html"),
            });
          }}
        >
          Open Dashboard
        </button>
      </footer>
    </div>
  );
}

export default App;
