import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";

export default function MainLayout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />

      <main className="app-main">
        <div className="page-container">{children}</div>
      </main>

      <Footer />
    </div>
  );
}
