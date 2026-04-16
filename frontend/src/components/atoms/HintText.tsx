/**
 * @file HintText.tsx
 * 
 * @summary HintText component.
 *  A reusable hint text component for displaying hints or tips.
 * 
 * @exports HintText - The HintText component itself.
 */


import './HintText.css'


/**
 * Type definition for HintText component props.
 * @property {string} text - The hint text to display.
 */
type HintTextProps = {
    text: string;
};


/**
 * HintText component for displaying hints or tips.
 * 
 * @param text - The hint text to display.
 * @returns JSX element representing the hint text.
 */
const HintText: React.FC<HintTextProps> = ({ text }) => {
    return (
        <p className="hint-text">
            {text}
        </p>
    );
}

export default HintText;
