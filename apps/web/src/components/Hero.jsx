import "../styles/hero.css";

export default function Hero() {
  return (
    <section className="sra-hero" id="home">
      <div className="sra-hero__bg" aria-hidden="true" />

      <div className="sra-container sra-hero__content">
        <div className="sra-hero__badge">AI + Sustainability</div>

        <h1 className="sra-hero__title">
          Smart Recycle Assistant
        </h1>

        <p className="sra-hero__subtitle">
          Upload an image and detect waste with YOLO. Get category, confidence, and guidance for correct disposal.
        </p>

        <div className="sra-hero__cta">
          <a className="sra-btn sra-btn--primary" href="#demo">Try the Demo</a>
          <a className="sra-btn sra-btn--ghost" href="#about">Learn More</a>
        </div>
      </div>
    </section>
  );
}
