import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout.jsx";
import Hero from "../components/Hero.jsx";
import DetectionPanel from "../components/DetectionPanel.jsx";
import { getStoredUser, logout } from "../lib/auth";

export default function Home() {
    const navigate = useNavigate();
    const user = getStoredUser();

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <MainLayout>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                    gap: "12px",
                    flexWrap: "wrap",
                }}
            >
                <div>
                    <h2 style={{ marginBottom: "6px" }}>Welcome</h2>
                    <p style={{ margin: 0 }}>
                        {user?.fullName || user?.name || user?.email || "User"}
                    </p>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => navigate("/history")}>History</button>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </div>

            <Hero />
            <DetectionPanel />
        </MainLayout>
    );
}