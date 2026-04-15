import { getTranslations } from "@/modules/i18n";

const messages = getTranslations("app");

const STATUS_CONFIG = {
  released: {
    icon: "✓",
    className: "roadmap-status-released",
    dotClassName: "roadmap-dot-released",
  },
  inProgress: {
    icon: "◐",
    className: "roadmap-status-in-progress",
    dotClassName: "roadmap-dot-in-progress",
  },
  planned: {
    icon: "○",
    className: "roadmap-status-planned",
    dotClassName: "roadmap-dot-planned",
  },
} as const;

export default function RoadmapPage() {
  const { title, description, statusLabels, milestones } = messages.roadmap;

  return (
    <div className="roadmap-page">
      <div className="roadmap-header">
        <h1 className="roadmap-title">{title}</h1>
        <p className="roadmap-description">{description}</p>

        <div className="roadmap-legend">
          <span className="roadmap-legend-item">
            <span className={`roadmap-legend-dot roadmap-dot-released`} />
            {statusLabels.released}
          </span>
          <span className="roadmap-legend-item">
            <span className={`roadmap-legend-dot roadmap-dot-in-progress`} />
            {statusLabels.inProgress}
          </span>
          <span className="roadmap-legend-item">
            <span className={`roadmap-legend-dot roadmap-dot-planned`} />
            {statusLabels.planned}
          </span>
        </div>
      </div>

      <ol className="roadmap-timeline" data-testid="roadmap-timeline">
        {milestones.map((milestone) => {
          const config = STATUS_CONFIG[milestone.status];
          return (
            <li key={milestone.version} className="roadmap-milestone">
              <div className={`roadmap-dot ${config.dotClassName}`} aria-hidden="true">
                {config.icon}
              </div>
              <div className="roadmap-milestone-content">
                <div className="roadmap-milestone-header">
                  <span className="roadmap-version">{milestone.version}</span>
                  <h2 className="roadmap-milestone-title">{milestone.title}</h2>
                  <span className={`roadmap-status-badge ${config.className}`}>
                    {statusLabels[milestone.status]}
                  </span>
                </div>
                <ul className="roadmap-items">
                  {milestone.items.map((item) => (
                    <li key={item} className="roadmap-item">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
