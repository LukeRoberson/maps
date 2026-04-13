/**
 * @file DisclaimerItem.tsx
 * 
 * @summary DisclaimerItem component.
 *  A reusable component for displaying individual disclaimer items in a structured format.
 * 
 * @types DisclaimerItemProps - Type definition for the props passed to the DisclaimerItem component.
 * 
 * @exports DisclaimerItem - The DisclaimerItem component itself.
 */


// Type definition for the props passed to the DisclaimerItem component
type DisclaimerItemProps = {
    label: string;
    content: string;
}


/**
 * Atomic component for displaying a single disclaimer item, consisting of a label and content.
 * 
 * @param label - The label for the disclaimer item, displayed in bold.
 * @param content - The content for the disclaimer item, displayed after the label.
 * @returns JSX element representing the disclaimer item.
 */
const DisclaimerItem: React.FC<DisclaimerItemProps> = ({ label, content }) => {
    return (
        <p>
            <strong>{label}</strong> {content}
        </p>
    );
};

export default DisclaimerItem;
