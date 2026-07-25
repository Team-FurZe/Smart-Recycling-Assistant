import { useEffect, useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout.jsx";
import { getMyHistory } from "../lib/api";
import { getToken } from "../lib/auth";
import HistoryImageOverlay from "../components/HistoryImageOverlay.jsx";
import "../styles/history-page.css";

export default function History() {
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
                    // keep original message
                }
                setError(message);
            } finally {
                setLoading(false);
            }
        }

        fetchHistory();
    }, []);

    function formatDate(value) {
        if (!value) return "-";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
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
                const labels =
                    prediction?.detections?.map((d) => d.label).join(" ") || "";

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
            return <span className="history-empty-badge">No labels</span>;
        }

        return parsed.detections.map((item, index) => (
            <span className="history-badge" key={`${item.label}-${index}`}>
        {item.label}
      </span>
        ));
    }

    function renderDetails(predictionJson) {
        const parsed = parsePrediction(predictionJson);

        if (!parsed) {
            return (
                <pre className="history-details-pre">
          {predictionJson}
        </pre>
            );
        }

        if (parsed.noWaste) {
            return (
                <p className="history-details-empty">
                    No detectable waste found in this image.
                </p>
            );
        }

        if (!Array.isArray(parsed.detections) || parsed.detections.length === 0) {
            return (
                <p className="history-details-empty">
                    No detection details available.
                </p>
            );
        }

        return (
            <div className="history-details-grid">
                {parsed.detections.map((item) => (
                    <div className="history-detail-card" key={item.id || item.label}>
                        <p><strong>Label:</strong> {item.label}</p>
                        <p>
                            <strong>Confidence:</strong>{" "}
                            {(item.confidence * 100).toFixed(2)}%
                        </p>
                        <p><strong>Bin Color:</strong> {item.binColor}</p>

                        {item.bbox && (
                            <p>
                                <strong>Box:</strong> x: {item.bbox.x?.toFixed?.(1) ?? item.bbox.x},
                                {" "}y: {item.bbox.y?.toFixed?.(1) ?? item.bbox.y},
                                {" "}w: {item.bbox.width?.toFixed?.(1) ?? item.bbox.width},
                                {" "}h: {item.bbox.height?.toFixed?.(1) ?? item.bbox.height}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <MainLayout>
            <section className="history-page">
                <div className="history-page__header">
                    <div>
                        <p className="history-page__eyebrow">History</p>
                        <h1 className="history-page__title">Prediction History</h1>
                        <p className="history-page__subtitle">
                            Review your previous uploads, detections, labels, and details.
                        </p>
                    </div>
                </div>

                <div className="history-toolbar">
                    <input
                        className="history-search"
                        type="text"
                        placeholder="Search by file name or label..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <select
                        className="history-sort"
                        value={dateOrder}
                        onChange={(e) => setDateOrder(e.target.value)}
                    >
                        <option value="desc">Newest first</option>
                        <option value="asc">Oldest first</option>
                    </select>
                </div>

                {loading && <div className="history-info-card">Loading history...</div>}

                {!loading && error && (
                    <div className="history-info-card history-info-card--error">
                        {error}
                    </div>
                )}

                {!loading && !error && filteredItems.length === 0 && (
                    <div className="history-info-card">No history found yet.</div>
                )}

                {!loading && !error && filteredItems.length > 0 && (
                    <div className="history-list">
                        {filteredItems.map((item) => (
                            <article className="history-card" key={item.id}>
                                <div className="history-card__image">
                                    {item.imageUrl ? (
                                        <HistoryImageOverlay
                                            imageUrl={item.imageUrl}
                                            predictionJson={item.predictionJson}
                                            alt={item.originalFileName || "History item"}
                                        />
                                    ) : (
                                        <div className="history-card__image-empty">No image</div>
                                    )}
                                </div>

                                <div className="history-card__content">
                                    <div className="history-card__meta">
                                        <div>
                                            <h3 className="history-card__title">
                                                {item.originalFileName || "Untitled file"}
                                            </h3>
                                            <p className="history-card__date">
                                                {formatDate(item.createdAt)}
                                            </p>
                                        </div>

                                        <button
                                            className="history-toggle-btn"
                                            onClick={() =>
                                                setExpandedId((prev) => (prev === item.id ? null : item.id))
                                            }
                                            type="button"
                                        >
                                            {expandedId === item.id ? "Hide Details" : "View Details"}
                                        </button>
                                    </div>

                                    <p className="history-card__summary">
                                        {renderPredictionSummary(item.predictionJson)}
                                    </p>

                                    <div className="history-card__badges">
                                        {renderBadges(item.predictionJson)}
                                    </div>

                                    {expandedId === item.id && (
                                        <div className="history-card__details">
                                            {renderDetails(item.predictionJson)}
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </MainLayout>
    );
}