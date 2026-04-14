/**
 * @file InformationTemplate.tsx
 * 
 * @summary Information page template.
 *  A reusable template for information pages, displaying a card with various sections
 * 
 * @exports InformationTemplate - The InformationTemplate component itself.
 */


import { CardContent } from "@/components/organisms/Card";
import Card from "@/components/organisms/Card";

import './InformationTemplate.css'


// Type definition for the props passed to the InformationTemplate component
type InfoTemplateProps = {
    cardConfig: CardContent;
};


/**
 * InformationTemplate component for information pages
 * Displays a card with various sections based on the provided configuration.
 * 
 * @param cardConfig - Configuration object for the card component.
 * @returns JSX element representing the Information page template.
 */
const InformationTemplate: React.FC<InfoTemplateProps> = ({ cardConfig }) => {
    return (
        /* The whole page */
        <div className="page-wrapper">
            {/* The card container */}
            <div className="card-wrapper">
                <Card {...cardConfig} />
            </div>
        </div>
    );
};

export default InformationTemplate;
