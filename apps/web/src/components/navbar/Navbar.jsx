import "./Navbar.css";

export default function Navbar() {
  const handleTryDemo = (e) => {
    e.preventDefault();
    const el = document.getElementById("demo");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <a className="navbar__brand" href="#home">
          <span className="navbar__logo" aria-hidden="true">S</span>
          <span className="navbar__title">Smart Recycle Assistant</span>
        </a>

        <nav className="navbar__nav" aria-label="Primary">
          <a className="navbar__link" href="#home">Home</a>
          <a className="navbar__link" href="#demo">Demo</a>
          <a className="navbar__link" href="#about">About</a>
        </nav>

        <a className="navbar__cta" href="#demo" onClick={handleTryDemo}>
          Try Demo
        </a>
      </div>
    </header>
  );
}
