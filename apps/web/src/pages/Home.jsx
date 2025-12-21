import MainLayout from "../layouts/MainLayout.jsx";
import Hero from "../components/Hero.jsx";
import DetectionPanel from "../components/DetectionPanel.jsx";

export default function Home() {
  return (
    <MainLayout>
      <section id="home" style={{ padding: "56px 0 24px" }}>
        <div className="sra-container content-panel">
          <Hero />
        </div>
      </section>

      <section id="demo" style={{ padding: "32px 0" }}>
        <div className="sra-container content-panel">
          <DetectionPanel />
        </div>
      </section>

      <section id="about" style={{ padding: "32px 0 80px" }}>
        <div className="sra-container content-panel">
          <h2 style={{ marginTop: 0 }}>About</h2>
          <p style={{ marginBottom: 0 }}>
            Smart Recycle Assistant helps classify waste into recyclable categories using computer vision.
          </p>
        </div>
      </section>
    </MainLayout>
  );
}
