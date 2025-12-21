
import "../styles/header.css";

export default function Header() {
  return (
    <header className="sra-header">
      <div className="sra-container sra-header__inner">
        <div className="sra-brand">
          <span className="sra-brand__mark">♻</span>
          <span className="sra-brand__name">Smart Recycle Assistant</span>
        </div>

        <nav className="sra-nav">
          <a href="#home">Home</a>
          <a href="#demo">Demo</a>
          <a href="#about">About</a>
        </nav>

        <button className="sra-header__cta" onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}>
          Try Demo
        </button>
      </div>
    </header>
  );
}
