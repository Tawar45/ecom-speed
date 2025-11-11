import React, { useEffect, useRef, useState } from "react";
import {Grid,LegacyCard,Button,Modal,TextStyle,Stack,Badge} from "@shopify/polaris";
import rocketImg from "../assets/speed.gif";
import { EmbededStoreURL, shopDomain, detectedVia } from "../assets/storeUrl.js";
const FALLBACK_ROCKET = "/mnt/data/c8be310c-7376-405d-8136-9bbcf4c3bb1f.png";

export default function SpeedUpMatrix({
  desktopScore = 98,
  mobileScore = 84,
  animationDuration = 900
}) {
  const [enabled, setEnabled] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState("desktop");
  const [currentScore, setCurrentScore] = useState(desktopScore);

  const rocketSrc =
    typeof rocketImg === "string" && rocketImg ? rocketImg : FALLBACK_ROCKET;
  const donutRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const target = selectedDevice === "mobile" 
      ? clamp(mobileScore, 0, 100)
      : clamp(desktopScore, 0, 100);
    setCurrentScore(target);
  }, [selectedDevice, desktopScore, mobileScore]);

  useEffect(() => {
    let start = null;
    const target = currentScore;
    const total = Math.max(200, animationDuration);
    if (animRef.current) cancelAnimationFrame(animRef.current);

    function tick(ts) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const p = Math.min(1, elapsed / total);
      const val = Math.round(target * easeOutCubic(p));
      applyDonutFill(donutRef.current, val);
      if (p < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        animRef.current = null;
      }
    }

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [currentScore, animationDuration]);

  function toggleEnabled() {
    if (!enabled) {
      // Redirect to EmbededStoreURL when enabling optimization
      window.open(EmbededStoreURL, '_blank');
    }
    setEnabled((s) => !s);
  }
  
  function handlePreview() {
    setShowModal(true);
  }
  
  function handleCloseModal() {
    setShowModal(false);
  }

  function handleDeviceSelect(device) {
    setSelectedDevice(device);
  }

  const getPerformanceColor = (score) => {
    if (score >= 90) return "#10b981";
    if (score >= 70) return "#f59e0b";
    return "#ef4444";
  };

  const getPerformanceStatus = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 70) return "Good";
    return "Needs Improvement";
  };

  const metrics = selectedDevice === "mobile"
    ? [
        { k: "Performance", v: mobileScore, unit: "%", target: 90 },
        { k: "LCP", v: 2.4, unit: "s", target: 2.5 },
        { k: "CLS", v: 0.08, unit: "", target: 0.1 },
        { k: "FID", v: 120, unit: "ms", target: 100 }
      ]
    : [
        { k: "Performance", v: desktopScore, unit: "%", target: 90 },
        { k: "LCP", v: 1.1, unit: "s", target: 2.5 },
        { k: "CLS", v: 0.02, unit: "", target: 0.1 },
        { k: "FID", v: 80, unit: "ms", target: 100 }
      ];

  return (
    <div className="speed-up-matrix-container">
      <style>{css}</style>

      <div className="testimonial-container">
        {/* Performance Card */}
        <div className="card-section performance-section">
          <LegacyCard sectioned>
            <div className={`perf-card ${selectedDevice === "mobile" ? "mobile" : "desktop"}`}>
              <div className="perf-header">
                <div className="perf-title-section">
                  <TextStyle variation="strong">Performance Metrics</TextStyle>
                  <Badge status={currentScore >= 90 ? "success" : currentScore >= 70 ? "warning" : "critical"}>
                    {getPerformanceStatus(currentScore)}
                  </Badge>
                </div>
                
                <div className="device-selector">
                  <div 
                    className={`device-option ${selectedDevice === "mobile" ? "active" : ""}`}
                    onClick={() => handleDeviceSelect("mobile")}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="device-icon">
                      <path 
                        d="M17 2H7C5.89543 2 5 2.89543 5 4V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V4C19 2.89543 18.1046 2 17 2Z" 
                        stroke="currentColor" 
                        strokeWidth="2"
                      />
                      <path 
                        d="M12 18H12.01" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round"
                      />
                    </svg>
                    <span>Mobile</span>
                  </div>
                  
                  <div 
                    className={`device-option ${selectedDevice === "desktop" ? "active" : ""}`}
                    onClick={() => handleDeviceSelect("desktop")}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="device-icon">
                      <path 
                        d="M21 2H3C2.44772 2 2 2.44772 2 3V16C2 16.5523 2.44772 17 3 17H21C21.5523 17 22 16.5523 22 16V3C22 2.44772 21.5523 2 21 2Z" 
                        stroke="currentColor" 
                        strokeWidth="2"
                      />
                      <path 
                        d="M8 22H16" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round"
                      />
                      <path 
                        d="M12 17V22" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round"
                      />
                    </svg>
                    <span>Desktop</span>
                  </div>
                </div>
              </div>

              <div className="perf-content">
                <div className="donut-container">
                  <div
                    className="donut"
                    ref={donutRef}
                    role="img"
                    aria-label={`Performance score ${currentScore} out of 100`}
                  >
                    <div className="donut-inner">
                      <div className="score" style={{ color: getPerformanceColor(currentScore) }}>
                        {currentScore}
                      </div>
                      <div className="score-label">Score</div>
                    </div>
                  </div>
                </div>

                <div className="metrics-grid">
                  {metrics.map((m) => (
                    <div className="metric-card" key={m.k}>
                      <div className="metric-header">
                        <span className="metric-name">{m.k}</span>
                        <span className={`metric-value ${m.v <= m.target ? "good" : "poor"}`}>
                          {m.v}{m.unit}
                        </span>
                      </div>
                      <div className="metric-bar-container">
                        <div 
                          className="metric-bar" 
                          style={{
                            width: `${Math.min(100, (m.v / m.target) * 100)}%`,
                            backgroundColor: m.v <= m.target ? getPerformanceColor(90) : getPerformanceColor(60)
                          }}
                        />
                        <div className="metric-target">Target: {m.target}{m.unit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </LegacyCard>
        </div>

        {/* Optimization Card */}
        <div className="card-section optimization-section">
          <LegacyCard sectioned>
            <div className={`optimization-card ${enabled ? "active" : "inactive"}`}>
              <div className="optimization-header">
                <div className="optimization-title">
                  <TextStyle variation="strong">
                    Performance Optimization
                  </TextStyle>
                  <div className="current-device-indicator">
                    <div className={`device-indicator ${selectedDevice}`}>
                      {selectedDevice === "mobile" ? (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path 
                              d="M17 2H7C5.89543 2 5 2.89543 5 4V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V4C19 2.89543 18.1046 2 17 2Z" 
                              stroke="#f59e0b" 
                              strokeWidth="2"
                            />
                            <path 
                              d="M12 18H12.01" 
                              stroke="#f59e0b" 
                              strokeWidth="2" 
                              strokeLinecap="round"
                            />
                          </svg>
                          Mobile View
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path 
                              d="M21 2H3C2.44772 2 2 2.44772 2 3V16C2 16.5523 2.44772 17 3 17H21C21.5523 17 22 16.5523 22 16V3C22 2.44772 21.5523 2 21 2Z" 
                              stroke="#10b981" 
                              strokeWidth="2"
                            />
                            <path 
                              d="M8 22H16" 
                              stroke="#10b981" 
                              strokeWidth="2" 
                              strokeLinecap="round"
                            />
                            <path 
                              d="M12 17V22" 
                              stroke="#10b981" 
                              strokeWidth="2" 
                              strokeLinecap="round"
                            />
                          </svg>
                          Desktop View
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="optimization-content">
                <div className="hero-section">
                  <div className="hero-info">
                    <div className="hero-main">
                      <h3 className="hero-title">
                        {enabled ? "🚀 Speed Boost Active" : "⏸️ Optimization Disable"}
                      </h3>
                      <p className="hero-description">
                        {enabled 
                          ? `Your ${selectedDevice} site is running at peak performance with automated optimizations`
                          : `Enable optimizations to improve ${selectedDevice} loading speed and user experience`
                        }
                      </p>
                    </div>

                    <div className="optimization-stats">
                      <div className="stat">
                        <div className="stat-value">
                          {selectedDevice === "mobile" ? "28%" : "12%"}
                        </div>
                        <div className="stat-label">Faster Loading</div>
                      </div>
                      <div className="stat">
                        <div className="stat-value">
                          {selectedDevice === "mobile" ? "15%" : "8%"}
                        </div>
                        <div className="stat-label">Conversion Boost</div>
                      </div>
                    </div>

                    <div className="action-buttons">
                      <Stack distribution="equalSpacing" alignment="center">
                        <Button onClick={handlePreview} plain>
                          View Details
                        </Button>
                        <Button 
                          onClick={toggleEnabled} 
                          primary={!enabled}
                          destructive={enabled}
                        >
                          {enabled ? "Disable Optimization" : "Enable Optimization"}
                        </Button>
                      </Stack>
                    </div>
                  </div>

                  <div className="hero-visual">
                    <div className="rocket-container">
                      <img
                        src={rocketSrc}
                        alt="Optimization Status"
                        className={`optimization-rocket ${enabled ? "launching" : "idle"}`}
                        loading="lazy"
                      />
                      <div className="rocket-trail"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </LegacyCard>
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={handleCloseModal}
        title="Performance Details"
        primaryAction={{ content: "Close", onAction: handleCloseModal }}
      >
        <Modal.Section>
          <div className="modal-content">
            <div className="modal-visual">
              <img
                src={rocketSrc}
                alt="Performance Optimization"
                className="modal-image"
              />
            </div>
            <div className="modal-info">
              <h3>Current Performance Status</h3>
              <p>Device: {selectedDevice === "mobile" ? "Mobile" : "Desktop"}</p>
              <p>Score: {currentScore}/100 ({getPerformanceStatus(currentScore)})</p>
              <p>Optimization: {enabled ? "Active" : "Disable"}</p>
              <div className="modal-metrics">
                <h4>Current Metrics:</h4>
                {metrics.map((metric) => (
                  <div key={metric.k} className="modal-metric">
                    <span>{metric.k}:</span>
                    <strong>{metric.v}{metric.unit}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal.Section>
      </Modal>
    </div>
  );
}

function clamp(v, a, b) {
  const n = Number(v) || 0;
  return Math.max(a, Math.min(b, n));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function applyDonutFill(el, currentScore) {
  if (!el) return;
  const ring = getPerformanceColor(currentScore);
  const rem = "rgba(0,0,0,0.06)";
  const inner = "#fff";
  el.style.background = `conic-gradient(${ring} 0% ${currentScore}%, ${rem} ${currentScore}% 100%), ${inner}`;
  const label = el.querySelector(".score");
  if (label) label.textContent = String(currentScore);
}

function getPerformanceColor(score) {
  if (score >= 90) return "#10b981";
  if (score >= 70) return "#f59e0b";
  return "#ef4444";
}

const css = `

/* Main Container */
.testimonial-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  // gap: 24px;
  align-items: stretch;
  width: 100%;
  padding : 10px;
}

.card-section {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Ensure both cards have equal height */
.performance-section,
.optimization-section {
  height: 100%;
}

.LegacyCard {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Performance Card Styles */
.perf-card {
 padding: 20px;
  // background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  // border-radius: 12px;
  // border: 2px solid #e2e8f0;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 400px;
  // box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.perf-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 24px; 
  flex-shrink: 0;
}

.perf-title-section { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
}

/* Device Selector */
.device-selector { 
  display: flex; 
  gap: 8px; 
  background: #f1f5f9; 
  padding: 4px; 
  border-radius: 8px; 
}

.device-option { 
  display: flex; 
  align-items: center; 
  gap: 6px; 
  padding: 8px 12px; 
  border-radius: 6px; 
  cursor: pointer; 
  transition: all 0.2s ease; 
  font-size: 14px; 
  color: #64748b; 
}

.device-option:hover { background: #e2e8f0; }
.device-option.active { background: white; color: #1e293b; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.device-icon { transition: all 0.2s ease; }
.device-option.active .device-icon { color: #3b82f6; }

.perf-content { 
  display: flex; 
  gap: 24px; 
  align-items: center; 
  flex: 1;
  min-height: 0;
}

.donut-container { 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: 16px; 
  flex-shrink: 0;
}

.donut { 
  width: 140px; 
  height: 140px; 
  border-radius: 50%; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  background: conic-gradient(#10b981 0% 0%, rgba(0,0,0,0.06) 0% 100%), #f6fff4; 
  box-shadow: 0 8px 32px rgba(15,23,42,0.1); 
  position: relative; 
}

.donut-inner { 
  width: 100px; 
  height: 100px; 
  border-radius: 50%; 
  background: white; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: center; 
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.05); 
}

.score { 
  font-weight: 800; 
  font-size: 32px; 
  line-height: 1; 
}

.score-label { 
  font-size: 12px; 
  color: #64748b; 
  margin-top: -4px; 
}

.metrics-grid { 
  flex: 1; 
  display: grid; 
  grid-template-columns: 1fr 1fr; 
  gap: 16px; 
  min-height: 0;
}

.metric-card { 
  background: white; 
  padding: 16px; 
  border-radius: 8px; 
  box-shadow: 0 2px 8px rgba(0,0,0,0.05); 
}

.metric-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 12px; 
}

.metric-name { 
  font-size: 13px; 
  color: #64748b; 
  font-weight: 600; 
}

.metric-value { 
  font-size: 15px; 
  font-weight: 700; 
}

.metric-value.good { color: #10b981; }
.metric-value.poor { color: #ef4444; }

.metric-bar-container { 
  position: relative; 
}

.metric-bar { 
  height: 6px; 
  border-radius: 3px; 
  transition: all 0.3s ease; 
}

.metric-target { 
  font-size: 11px; 
  color: #94a3b8; 
  margin-top: 6px; 
}

/* Optimization Card Styles */
.optimization-card {
   padding: 20px;
  // border-radius: 12px;
  // border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 400px;
  // box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

// .optimization-card.active { 
//   background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); 
//   border: 1px solid #bbf7d0; 
// }

// .optimization-card.inactive { 
//   background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); 
//   border: 1px solid #fecaca; 
// }

// .optimization-header { 
//   margin-bottom: 24px; 
//   flex-shrink: 0;
// }

.optimization-title { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
}

.current-device-indicator { 
  display: flex; 
  align-items: center; 
}

.device-indicator { 
  display: flex; 
  align-items: center; 
  gap: 6px; 
  padding: 6px 10px; 
  border-radius: 6px; 
  font-size: 13px; 
  font-weight: 600; 
}

.device-indicator.mobile { 
  background: #fef3c7; 
  color: #d97706; 
}

.device-indicator.desktop { 
  background: #d1fae5; 
  color: #059669; 
}

.optimization-content { 
  display: flex; 
  flex-direction: column; 
  gap: 20px; 
  flex: 1;
  min-height: 0;
}

.hero-section { 
  display: flex; 
  gap: 24px; 
  align-items: center; 
  height: 100%;
}

.hero-info { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  gap: 20px; 
  justify-content: space-between;
  height: 100%;
}

.hero-main { 
  display: flex; 
  flex-direction: column; 
  gap: 12px; 
}

.hero-title { 
  font-size: 20px; 
  font-weight: 700; 
  margin: 0; 
  color: #1e293b; 
  line-height: 1.3;
}

.hero-description { 
  font-size: 15px; 
  color: #64748b; 
  margin: 0; 
  line-height: 1.5; 
}

.optimization-stats { 
  display: flex; 
  gap: 32px; 
  flex-shrink: 0;
}

.stat { 
  text-align: center; 
  flex: 1;
}

.stat-value { 
  font-size: 28px; 
  font-weight: 800; 
  color: #10b981; 
  line-height: 1;
}

.stat-label { 
  font-size: 13px; 
  color: #64748b; 
  margin-top: 4px;
}

.action-buttons { 
  margin-top: auto;
  flex-shrink: 0;
}

.hero-visual { 
  display: flex; 
  justify-content: center; 
  align-items: center;
  flex-shrink: 0;
}

.rocket-container { 
  position: relative; 
  display: flex; 
  justify-content: center; 
}

.optimization-rocket { 
  width: 120px; 
  height: auto; 
  transition: all 0.5s ease; 
}

.optimization-rocket.launching { 
  transform: translateY(-5px) scale(1.05); 
  animation: float 2s ease-in-out infinite; 
}

.optimization-rocket.idle { 
  transform: scale(0.9); 
  opacity: 0.7; 
  filter: grayscale(0.3); 
}

.rocket-trail { 
  position: absolute; 
  bottom: -15px; 
  width: 80px; 
  height: 25px; 
  background: radial-gradient(ellipse at center, rgba(59,130,246,0.4) 0%, transparent 70%); 
  border-radius: 50%; 
}

/* Animations */
@keyframes float {
  0%, 100% { transform: translateY(-5px) scale(1.05); }
  50% { transform: translateY(5px) scale(1.05); }
}

/* ===== RESPONSIVE DESIGN ===== */

/* Large Desktop (1440px and above) */
@media (min-width: 1440px) {
  .testimonial-container {
    grid-template-columns: 1fr 1fr;
    // gap: 32px;
  }
  
  .perf-card,
  .optimization-card {
    padding: 24px;
    min-height: 450px;
  }
  
  .donut {
    width: 160px;
    height: 160px;
  }
  
  .donut-inner {
    width: 115px;
    height: 115px;
  }
  
  .score {
    font-size: 36px;
  }
  
  .hero-title {
    font-size: 22px;
  }
  
  .optimization-rocket {
    width: 140px;
  }
}

/* Desktop (1200px - 1439px) */
@media (min-width: 1200px) and (max-width: 1439px) {
  .testimonial-container {
    // gap: 28px;
  }
  
  .perf-card,
  .optimization-card {
    padding: 22px;
    min-height: 420px;
  }
  
  .donut {
    width: 150px;
    height: 150px;
  }
  
  .donut-inner {
    width: 110px;
    height: 110px;
  }
}

/* Laptop (1024px - 1199px) */
@media (min-width: 1024px) and (max-width: 1199px) {
  .testimonial-container {
    // gap: 20px;
  }
  
  .perf-content {
    gap: 20px;
  }
  
  .donut {
    width: 130px;
    height: 130px;
  }
  
  .donut-inner {
    width: 95px;
    height: 95px;
  }
  
  .score {
    font-size: 28px;
  }
  
  .metrics-grid {
    gap: 12px;
  }
  
  .metric-card {
    padding: 12px;
  }
  
  .optimization-stats {
    gap: 24px;
  }
  
  .stat-value {
    font-size: 24px;
  }
}

/* Tablet Landscape (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .testimonial-container {
    grid-template-columns: 1fr;
    // gap: 20px;
  }
  
  .perf-content {
    flex-direction: row;
    gap: 20px;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .hero-section {
    flex-direction: row;
  }
  
  .optimization-stats {
    gap: 20px;
  }
}

/* Tablet Portrait (600px - 767px) */
@media (min-width: 600px) and (max-width: 767px) {
  .testimonial-container {
    grid-template-columns: 1fr;
    // gap: 16px;
  }
  
  .perf-card,
  .optimization-card {
    padding: 16px;
    min-height: 380px;
  }
  
  .perf-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .device-selector {
    align-self: stretch;
    gap: 4px;
  }
  
  .perf-content {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr 1fr;
    width: 100%;
    gap: 12px;
  }
  
  .hero-section {
    flex-direction: column-reverse;
    gap: 20px;
  }
  
  .optimization-title {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .optimization-stats {
    justify-content: space-around;
  }
}

/* Mobile (480px - 599px) */
@media (min-width: 480px) and (max-width: 599px) {
  .testimonial-container {
    grid-template-columns: 1fr;
    // gap: 16px;
  }
  
  .perf-card,
  .optimization-card {
    padding: 16px;
    min-height: auto;
  }
  
  .perf-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .device-selector {
    width: 100%;
    justify-content: space-between;
    gap: 2px;
  }
  
  .device-option {
    flex: 1;
    justify-content: center;
    min-width: 0;
    padding: 6px 8px;
    font-size: 13px;
  }
  
  .perf-content {
    flex-direction: column;
    gap: 20px;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  
  .hero-section {
    flex-direction: column-reverse;
    gap: 16px;
  }
  
  .hero-title {
    font-size: 18px;
  }
  
  .hero-description {
    font-size: 14px;
  }
  
  .optimization-stats {
    gap: 16px;
  }
  
  .stat-value {
    font-size: 22px;
  }
}

/* Small Mobile (320px - 479px) */
@media (max-width: 479px) {
  .testimonial-container {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .perf-card,
  .optimization-card {
    padding: 12px;
  }
  
  .perf-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .device-selector {
    width: 100%;
    justify-content: space-between;
  }
  
  .perf-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .donut {
    width: 120px;
    height: 120px;
  }
  
  .donut-inner {
    width: 85px;
    height: 85px;
  }
  
  .score {
    font-size: 24px;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .hero-section {
    flex-direction: column-reverse;
    gap: 12px;
  }
  
  .hero-title {
    font-size: 16px;
  }
  
  .hero-description {
    font-size: 13px;
  }
  
  .optimization-stats {
    flex-direction: column;
    gap: 12px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 8px;
  }
  
  .optimization-rocket {
    width: 80px;
  }
}

/* Modal Styles */
.modal-content { 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: 20px; 
  text-align: center; 
}

.modal-image { 
  max-width: 200px; 
  height: auto; 
  border-radius: 12px; 
}

.modal-metrics { 
  margin-top: 16px; 
  text-align: left; 
}

.modal-metric { 
  display: flex; 
  justify-content: space-between; 
  margin: 8px 0; 
}
`;