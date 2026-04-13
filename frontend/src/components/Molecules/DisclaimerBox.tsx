/**
 * @file DisclaimerBox.tsx
 * 
 * @summary DisclaimerBox component.
 *  A reusable component for displaying a disclaimer box in a structured format.
 *  This component uses the DisclaimerBox.css file for styling.
 *
 * @types DisclaimerBoxProps - Type definition for the props passed to the DisclaimerBox component.
 * 
 * @exports DisclaimerBox - The DisclaimerBox component itself.
 * @exports DisclaimerBoxProps - Type definition for the props passed to the DisclaimerBox component.
 */


import DisclaimerItem from '../atoms/DisclaimerItem';
import './DisclaimerBox.css';


// DisclaimerBox component props
export type DisclaimerBoxProps = {
    title?: string;
    items: {
        label: string;
        content: string;
    }[];
}


/**
 * DisclaimerBox component for displaying a disclaimer section with multiple items.
 * Each item consists of a label and content, displayed in a structured format.
 * 
 * @param title - The title of the disclaimer box.
 * @param items - An array of disclaimer items, each containing a label and content.
 * @returns JSX element representing the disclaimer box.
 */
const DisclaimerBox: React.FC<DisclaimerBoxProps> = ({ title, items }) => {
    return (
        <section className="disclaimer-box">
            {
                title &&
                <h2>{title}</h2>
            }
            
            {items.map((item, index) => (
                <DisclaimerItem key={index} label={item.label} content={item.content} />
            ))}
            <br/>
        </section>
    );
}

export default DisclaimerBox;
