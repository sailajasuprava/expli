export default function Viewer() {
  const handleContinue = () => {
    window.location.href = chrome.runtime.getURL("dashboard.html");
  };

  return (
    <div className="bg">
      <div className="container">
        <div className="logo-wrapper">
          <div className="logo-text">TaskFlow</div>
        </div>

        <h1>Welcome! Let’s get started</h1>
        <p className="subtitle">How do you plan to use TaskFlow?</p>

        {/* cards */}
        <div className="cards">
          {/* Personal */}
          <div className="card">
            <div className="icon-box">👤</div>
            <h3>Personal</h3>
            <p>Organize your personal tasks, goals, and daily activities</p>
          </div>

          {/* Work */}
          <div className="card selected">
            <div className="badge">✔</div>
            <div className="icon-box active">💼</div>
            <h3>Work & Team</h3>
            <p className="text-gray">
              Collaborate with your team and manage projects together
            </p>
          </div>
        </div>

        <button className="continue" onClick={handleContinue}>
          Continue →
        </button>
      </div>
    </div>
  );
}
