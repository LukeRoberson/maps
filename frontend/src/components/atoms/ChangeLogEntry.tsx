/**
 * @file ChangeLogEntry.tsx
 * 
 * @summary ChangeLogEntry component.
 *  A reusable component for displaying individual change log entries in a structured format.
 * 
 * @types ChangeLogEntryProps - Type definition for the props passed to the ChangeLogEntry component.
 * 
 * @exports ChangeLogEntry - The ChangeLogEntry component itself.
 */


import './ChangeLogEntry.css';


// Type definition for the props passed to the ChangeLogEntry component, including version, date, and an array of changes.
type ChangeLogEntryProps = {
    version: string;
    date: string;
    changes: string[];
}


/**
 * ChangeLogEntry component for displaying a single change log entry,
 * consisting of a version, date, and list of changes.
 * 
 * @param version - The version number of the change log entry.
 * @param date - The date of the change log entry.
 * @param changes - An array of strings representing the individual changes in this entry.
 * 
 * @returns JSX element representing the change log entry.
 */
const ChangeLogEntry: React.FC<ChangeLogEntryProps> = ({ version, date, changes }) => {
    return (
        <div className="changelog-entry">
            <h3 className="changelog-entry-h3">{version} - {date}</h3>
            <ul>
                {changes.map((change, index) => (
                    <li className="pl-6 relative before:content-['→'] before:absolute before:left-0 before:text-blue-700" key={index}>{change}</li>
                ))}
            </ul>
        </div>
    );
}

export default ChangeLogEntry;
