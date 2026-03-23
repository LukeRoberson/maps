import React, { useState } from 'react';
import type { MapArea } from '@/components/map/types';
import type { Boundary } from '@/components/boundary/types';
import './suburb-list.css';

interface SuburbListProps {
  suburbs: MapArea[];
  suburbBoundaries: Record<number, Boundary>;
  hiddenSuburbIds: Set<number>;
  onToggleSuburb: (suburbId: number, visible: boolean) => void;
}

export const SuburbList: React.FC<SuburbListProps> = ({
  suburbs,
  suburbBoundaries,
  hiddenSuburbIds,
  onToggleSuburb,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const suburbsWithBoundary = suburbs.filter(s => s.id != null && suburbBoundaries[s.id!] != null);

  return (
    <div className="suburb-list">
      <div
        className="suburb-list-header"
        onClick={() => setIsExpanded(prev => !prev)}
        role="button"
        aria-expanded={isExpanded}
      >
        <h3>Suburbs</h3>
        <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && (
        <div className="suburb-list-content">
          {suburbsWithBoundary.length === 0 ? (
            <p className="suburb-list-empty">No suburbs with boundaries.</p>
          ) : (
            <ul className="suburb-item-list">
              {suburbsWithBoundary.map(suburb => {
                const visible = !hiddenSuburbIds.has(suburb.id!);
                return (
                  <li key={suburb.id} className="suburb-item">
                    <div className="suburb-color-indicator" />
                    <button
                      className={`btn-visibility ${visible ? 'visible' : 'hidden'}`}
                      onClick={() => onToggleSuburb(suburb.id!, visible)}
                      title={visible ? 'Hide suburb' : 'Show suburb'}
                    >
                      {visible ? '👁' : '👁‍🗨'}
                    </button>
                    <span className={`suburb-name ${visible ? '' : 'suburb-name-hidden'}`}>
                      {suburb.name}
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
