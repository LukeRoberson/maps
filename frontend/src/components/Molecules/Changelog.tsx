/**
 * @file Changelog.tsx
 * 
 * @summary Changelog component.
 *  A reusable component for displaying a changelog in a structured format.
 * 
 * @types ChangelogProps - Type definition for the props passed to the Changelog component.
 * 
 * @exports Changelog - The Changelog component itself.
 * @exports ChangelogProps - Type definition for the props passed to the Changelog component.
 */


import ChangeLogEntry from '../atoms/ChangeLogEntry';
import './Changelog.css';


// Changelog component props
export type ChangelogProps = {
    title?: string;
    entries: {
        version: string;
        date: string;
        changes: string[];
    }[];
}


/**
 * Changelog component for displaying a list of changelog entries in a structured format.
 * 
 * @param title - Optional title for the changelog section.
 * @param entries - An array of changelog entries, each containing a version, date, and list of changes.
 * @returns JSX element representing the changelog
 */
const Changelog: React.FC<ChangelogProps> = ({ title, entries }) => {
    return (
        <section className="changelog">
            {
                title &&
                <h2>{title}</h2>
            }

            {entries.map((entry, index) => (
                <ChangeLogEntry key={index} version={entry.version} date={entry.date} changes={entry.changes} />
            ))}
            <br/>
        </section>
    );
}

export default Changelog;
