/**
 * @file Card.tsx
 * 
 * @summary Card component.
 *  A reusable card component for displaying content in a structured format.
 * 
 * @exports Card - The Card component itself.
 * @exports CardConfig - Type definition for the configuration object used to customize the Card component.
 */


import CardSection from '../Molecules/CardSection';
import FeatureList from '../Molecules/FeatureList';
import DisclaimerBox from '../Molecules/DisclaimerBox';
import Changelog from '../Molecules/Changelog';

import type { CardSectionConfig } from '../Molecules/CardSection';
import type { FeatureListProps } from '../Molecules/FeatureList';
import type { DisclaimerBoxProps } from '../Molecules/DisclaimerBox';
import type { ChangelogProps } from '../Molecules/Changelog';

import './Card.css'


/**
 * Card configuration type
 */
export type CardConfig = {
    title?: string;
    sections: CardSectionConfig[];
    features?: FeatureListProps;
    disclaimer?: DisclaimerBoxProps;
    changelog?: ChangelogProps;

};


/**
 * Card component props
 */
type CardProps = {
    config: CardConfig;
};


/**
 * A Card component
 * Displays a title and content sections
 * 
 * @param config - Configuration object for the card, including title and content
 * @returns JSX element representing the card
 */
const Card: React.FC<CardProps> = ({ config }) => {
    // Destructure props
    const { title, sections, features, disclaimer, changelog } = config;

    return(
        <>
            {title &&
               <h1>{title}</h1>
            }
            
            {/* The entire page is divided into sections */}
            <div className="about-section">
                {sections.map((sectionConfig, index) => (
                    <CardSection key={index} config={sectionConfig}/>
                ))}

                {features &&
                    <FeatureList {...features} />
                }
                {disclaimer &&
                    <DisclaimerBox {...disclaimer} />
                }
                {changelog &&
                    <Changelog {...changelog} />
                }
            </div>
        </>
    )
}

export default Card;
