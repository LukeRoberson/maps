/**
 * @file AboutTemplate.tsx
 * 
 * @summary About page template.
 *  A reusable template for the About page, displaying a card with various sections
 * 
 * @exports AboutTemplate - The AboutTemplate component itself.
 */


import { CardConfig } from "@/components/organisms/Card";
import Card from "@/components/organisms/Card";


// Type definition for the props passed to the AboutTemplate component
type AboutTemplateProps = {
    cardConfig: CardConfig;
};


/**
 * AboutTemplate component for the About page
 * Displays a card with various sections based on the provided configuration.
 * 
 * @param cardConfig - Configuration object for the card component.
 * @returns JSX element representing the About page template.
 */
const AboutTemplate: React.FC<AboutTemplateProps> = ({ cardConfig }) => {
    return (
        <div className="about-page">
            <div className="card">
                <Card config={cardConfig} />
            </div>
        </div>
    );
};

export default AboutTemplate;
