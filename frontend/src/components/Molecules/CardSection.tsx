/**
 * @file CardSection.tsx
 * 
 * @summary Card section component.
 *  A reusable card section component for displaying content in a structured format.
 * 
 * @types CardSectionConfig - Type definition for the configuration object used to customize the CardSection component.
 * @types DisclaimerItem - Type definition for individual disclaimer items.
 * @types ChangeLogEntry - Type definition for individual change log entries.
 * 
 * @exports CardSection - The CardSection component itself.
 * @exports CardSectionConfig - Type definition for the configuration object used to customize the CardSection component.
 */


import './CardSection.css';


/**
 * CardSection configuration type
 * Defines the structure of the configuration object that can be passed to the CardSection component
 */
export type CardSectionConfig = {
    title?: string;
    paragraphs?: string[];
};


/**
 * Disclaimer item type
 * Defines a label, which is <strong> text
 * Defines content, which is the text that follows the label in the disclaimer section
 */
type DisclaimerItem = {
    label: string;
    content: string;
}


/**
 * Change log entry type
 * Defines the structure of individual entries in the change log section
 */
type ChangeLogEntry = {
    version: string;
    date: string;
    changes: string[];
}


/**
 * CardSection component props
 */
type CardSectionProps = {
    config: CardSectionConfig;
}


/**
 * CardSection component
 * Displays a section with an optional title, multiple paragraphs of text, and an optional unordered list
 * 
 * @param config - Configuration object for the CardSection component, including title, paragraphs, and unordered list items
 * @returns JSX element representing the card section
 */
const CardSection: React.FC<CardSectionProps> = ({config}) => {
    // Destructure configuration object
    const { title, paragraphs } = config;

    return(
        <>
            <section>
                {/* Section Title */}
                {title &&
                    <h2 className="card-section-h2">{title}</h2>
                }

                {/* Paragraphs */}
                {paragraphs &&
                    paragraphs.map((text, index) => (
                        <p key={index}>{text}</p>
                    ))
                }
                <br/>
            </section>
        </>
    );
}

export default CardSection;
