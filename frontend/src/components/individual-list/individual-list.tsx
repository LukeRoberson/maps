import React, { useState } from 'react';
import type { MapArea } from '@/components/map/types';
import type { Boundary } from '@/components/boundary/types';
import './individual-list.css';

interface IndividualListProps {
  individuals: MapArea[];
  individualBoundaries: Record<number, Boundary>;
  hiddenIndividualIds: Set<number>;
  currentMapAreaId?: number;
  onToggleIndividual: (individualId: number, visible: boolean) => void;
}

export const IndividualList: React.FC<IndividualListProps> = ({
  individuals,
  individualBoundaries,
  hiddenIndividualIds,
  currentMapAreaId,
  onToggleIndividual,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Exclude the current map's own entry — it's rendered separately
  const peersWithBoundary = individuals.filter(
    i => i.id != null && i.id !== currentMapAreaId && individualBoundaries[i.id!] != null
  );

  return (
    <div className="individual-list">
      <div
        className="individual-list-header"
        onClick={() => setIsExpanded(prev => !prev)}
        role="button"
        aria-expanded={isExpanded}
      >
        <h3>Individual Maps</h3>
        <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && (
        <div className="individual-list-content">
          {peersWithBoundary.length === 0 ? (
            <p className="individual-list-empty">No individual maps with boundaries.</p>
          ) : (
            <ul className="individual-item-list">
              {peersWithBoundary.map(individual => {
                const visible = !hiddenIndividualIds.has(individual.id!);
                return (
                  <li key={individual.id} className="individual-item">
                    <div className="individual-color-indicator" />
                    <button
                      className={`btn-visibility ${visible ? 'visible' : 'hidden'}`}
                      onClick={() => onToggleIndividual(individual.id!, visible)}
                      title={visible ? 'Hide individual map' : 'Show individual map'}
                    >
                      {visible ? '👁' : '👁‍🗨'}
                    </button>
                    <span className={`individual-name ${visible ? '' : 'individual-name-hidden'}`}>
                      {individual.name}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
