/**
 * @file StrongPair.tsx
 * 
 * @summary StrongPair component.
 *  A reusable component for displaying a label-value pair with strong emphasis on the label.
 * 
 * @exports StrongPair - The StrongPair component itself.
 */


import './StrongPair.css'


/**
 * Type definition for the props of the StrongPair component.
 * This component is used to display a label and a value together, where the label is emphasized with strong text.
 * The props include a 'label' which is the emphasized part, and a 'value' which is the regular text following it.
 */
type StrongPairProps = {
    label: string;
    value: string;
    style?: 'default' | 'box' | 'emphasis';
}


/**
 * StrongPair component.
 *  A reusable component for displaying a label-value pair with strong emphasis on the label.
 * 
 * @param label - The label text that will be displayed in strong emphasis.
 * @param value - The value text that will be displayed in regular font following the label.
 * @returns React element representing a label-value pair.
 */
const StrongPair: React.FC<StrongPairProps> = ({ label, value, style = 'default' }) => {
    if (style === 'box') {
        /* Box style displays the label and value in a vertical layout with the label in a box */
        return (
            <div className="strong-box">
                <strong>{label}</strong><br/>
                <span>{value}</span>
            </div>
        );
    } else if (style === 'emphasis') {
        /* Emphasis style displays the label in strong text with additional emphasis */
        return (
            <div className="strong-emphasis">
                <strong>{label} </strong>
                <span>{value}</span>
            </div>
        );
    } else {
        /* Default style displays the label and value in a horizontal layout with the label in strong text */
        return (
            <div className="strong-pair">
                <strong>{label} </strong>
                <span>{value}</span>
            </div>
        );
    }
}

export default StrongPair;
