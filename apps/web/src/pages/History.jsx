import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout.jsx";
import { getMyHistory } from "../lib/api";
import { getToken, logout } from "../lib/auth";
import HistoryImageOverlay from "../components/HistoryImageOverlay.jsx";

export default function History() {
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [dateOrder, setDateOrder] = useState("desc");

    useEffect(() => {
        async function fetchHistory() {
            setLoading(true);
            setError("");

            try {
                const token = getToken();
                const data = await getMyHistory(token);
                setItems(data || []);
            } catch (err) {
                let message = err.message || "Failed to load history";

                try {
                    const parsed = JSON.parse(message);
                    message = parsed.message || message;
                } catch {
                }

                setError(message);
            } finally {
                setLoading(false);
            }
        }

        fetchHistory();
    }, []);

    function handleLogout() {
        logout();
        navigate("/login");
    }

    function formatDate(value) {
        if (!value) return "-";
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date.toLocaleString();
    }

    function parsePrediction(predictionJson) {
        if (!predictionJson) return null;

        try {
            return JSON.parse(predictionJson);
        } catch {
            return null;
        }
    }

    const filteredItems = useMemo(() => {
        const q = search.trim().toLowerCase();

        let data = [...items];

        if (q) {
            data = data.filter((item) => {
                const prediction = parsePrediction(item.predictionJson);
                const labels = prediction?.detections?.map((d) => d.label).join(" ") || "";

                return (
                    (item.originalFileName || "").toLowerCase().includes(q) ||
                    labels.toLowerCase().includes(q)
                );
            });
        }

        data.sort((a, b) => {
            const da = new Date(a.createdAt).getTime();
            const db = new Date(b.createdAt).getTime();
            return dateOrder === "asc" ? da - db : db - da;
        });

        return data;
    }, [items, search, dateOrder]);

    function renderPredictionSummary(predictionJson) {
        const parsed = parsePrediction(predictionJson);

        if (!parsed) return "Prediction data could not be parsed.";
        if (parsed.noWaste) return "No detectable waste found.";

        if (Array.isArray(parsed.detections) && parsed.detections.length > 0) {
            return `${parsed.detections.length} detection(s) found`;
        }

        return "Prediction data available";
    }

    function renderBadges(predictionJson) {
        const parsed = parsePrediction(predictionJson);

        if (!parsed || !Array.isArray(parsed.detections) || parsed.detections.length === 0) {
            return <span className="history-badge">No labels</span>;
        }

        return parsed.detections.map((item, index) => (
            <span key={`${item.label}-${index}`} className="history-badge">
        {item.label}
      </span>
        ));
    }

    function renderDetails(predictionJson) {
        const parsed = parsePrediction(predictionJson);

        if (!parsed) {
            return <pre className="history-json">{predictionJson}</pre>;
        }

        if (parsed.noWaste) {
            return <p>No detectable waste found in this image.</p>;
        }

        if (!Array.isArray(parsed.detections) || parsed.detections.length === 0) {
            return <p>No detection details available.</p>;
        }

        return (
            <div className="history-detail-list">
                {parsed.detections.map((item) => (
                    <div key={item.id} className="history-detail-card">
                        <div><strong>Label:</strong> {item.label}</div>
                        <div><strong>Confidence:</strong> {(item.confidence * 100).toFixed(2)}%</div>
                        <div><strong>Bin Color:</strong> {item.binColor}</div>
                        {item.bbox && (
                            <div>
                                <strong>Box:</strong> x: {item.bbox.x?.toFixed?.(1) ?? item.bbox.x},
                                {" "}y: {item.bbox.y?.toFixed?.(1) ?? item.bbox.y},
                                {" "}w: {item.bbox.width?.toFixed?.(1) ?? item.bbox.width},
                                {" "}h: {item.bbox.height?.toFixed?.(1) ?? item.bbox.height}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <MainLayout>
            <div className="history-header">
                <div>
                    <h1>Prediction History</h1>
                    <p>See your previous detection results.</p>
                </div>

                <div className="history-header-actions">
                    <button onClick={() => navigate("/")}>Back Home</button>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </div>

            <div className="history-toolbar">
                <input
                    type="text"
                    placeholder="Search by file name or label..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select value={dateOrder} onChange={(e) => setDateOrder(e.target.value)}>
                    <option value="desc">Newest first</option>
                    <option value="asc">Oldest first</option>
                </select>
            </div>

            {loading && <p>Loading history...</p>}

            {!loading && error && (
                <div className="history-error">
                    {error}
                </div>
            )}

            {!loading && !error && filteredItems.length === 0 && (
                <div className="history-empty">
                    No history found yet.
                </div>
            )}

            {!loading && !error && filteredItems.length > 0 && (
                <div className="history-grid">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="history-card">
                            {item.imageUrl ? (
                                <HistoryImageOverlay
                                    imageUrl={item.imageUrl}
                                    predictionJson={item.predictionJson}
                                    alt={item.originalFileName || "History item"}
                                />
                            ) : (
                                <div className="history-preview history-preview-empty">
                                    No image
                                </div>
                            )}

                            <div className="history-card-content">
                                <div className="history-row">
                                    <strong>File:</strong> {item.originalFileName || "-"}
                                </div>

                                <div className="history-row">
                                    <strong>Date:</strong> {formatDate(item.createdAt)}
                                </div>

                                <div className="history-row">
                                    <strong>Summary:</strong> {renderPredictionSummary(item.predictionJson)}
                                </div>

                                <div className="history-badges">
                                    {renderBadges(item.predictionJson)}
                                </div>

                                <button
                                    onClick={() =>
                                        setExpandedId((prev) => (prev === item.id ? null : item.id))
                                    }
                                >
                                    {expandedId === item.id ? "Hide Details" : "View Details"}
                                </button>

                                {expandedId === item.id && (
                                    <div className="history-details">
                                        {renderDetails(item.predictionJson)}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </MainLayout>
    );
}