import MainLayout from "../layouts/MainLayout.jsx";
import Hero from "../components/Hero.jsx";
import DetectionPanel from "../components/DetectionPanel.jsx";
import { getStoredUser } from "../lib/auth";
import "../styles/home-page.css";

export default function Home() {
    const user = getStoredUser();

    const displayName =
        user?.username || user?.fullName || user?.name || user?.email || "User";

    return (
        <MainLayout>
            <section className="home-page">
                <div className="home-page__welcome">
                    <div>
                        <p className="home-page__eyebrow">Welcome back</p>
                        <h1 className="home-page__title">{displayName}</h1>
                        <p className="home-page__subtitle">
                            Upload a waste image, review detections, and get recycling guidance
                            in a clean and simple interface.
                        </p>
                    </div>
                </div>

                <div className="home-page__hero">
                    <Hero />
                </div>

                <div className="home-page__panel" id="demo">
                    <DetectionPanel />
                </div>
            </section>
        </MainLayout>
    );
}