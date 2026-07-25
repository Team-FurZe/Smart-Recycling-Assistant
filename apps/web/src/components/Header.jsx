import "../styles/header.css";

export default function Header() {
  function scrollToDemo() {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <header className="sra-header">
      <div className="sra-container sra-header__inner">
        <div className="sra-brand">
          <span className="sra-brand__mark">S</span>
          <span className="sra-brand__name">Smart Recycle Assistant</span>
        </div>

        <nav className="sra-nav">
          <a href="#home">Home</a>
          <a href="#demo">Demo</a>
          <a href="#about">About</a>
        </nav>

        <button className="sra-header__cta" onClick={scrollToDemo} type="button">
          Try Demo
        </button>
      </div>
    </header>
  );
}
