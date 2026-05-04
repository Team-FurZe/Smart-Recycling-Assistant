import { NavLink, useNavigate } from "react-router-dom";

import Footer from "../components/footer/Footer";
import { getStoredUser, logout } from "../lib/auth";

import "./MainLayout.css";

export default function MainLayout({ children }) {
    const navigate = useNavigate();
    const user = getStoredUser();

    function handleLogout() {
        logout();
        navigate("/login");
    }

    const displayName =
        user?.username || user?.fullName || user?.name || user?.email || "User";

    return (
        <div className="app-shell">
            <header className="app-header">
                <div className="app-header__inner">
                    <button
                        className="app-brand"
                        onClick={() => navigate("/")}
                        type="button"
                    >
                        <span className="app-brand__icon">♻</span>
                        <span>
              <strong>Smart Recycle Assistant</strong>
            </span>
                    </button>

                    <nav className="app-nav">
                        <NavLink
                            to="/"
                            end
                            className={({ isActive }) =>
                                isActive
                                    ? "app-nav__link app-nav__link--active"
                                    : "app-nav__link"
                            }
                        >
                            Home
                        </NavLink>

                        <NavLink
                            to="/history"
                            className={({ isActive }) =>
                                isActive
                                    ? "app-nav__link app-nav__link--active"
                                    : "app-nav__link"
                            }
                        >
                            History
                        </NavLink>

                        <NavLink
                            to="/map"
                            className={({ isActive }) =>
                                isActive
                                    ? "app-nav__link app-nav__link--active"
                                    : "app-nav__link"
                            }
                        >
                            Map
                        </NavLink>
                    </nav>

                    <div className="app-actions">
                        <div className="app-user">
                            <span className="app-user__label">Signed in as</span>
                            <span className="app-user__name">{displayName}</span>
                        </div>

                        <button
                            className="app-logout-btn"
                            onClick={handleLogout}
                            type="button"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="app-main">
                <div className="app-main__inner">{children}</div>
            </main>

            <Footer />
        </div>
    );
}