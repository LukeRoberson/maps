/**
 * @file FeatureList.tsx
 * 
 * @summary FeatureList component.
 *  A reusable component for displaying a list of features in a structured format.
 *  This component uses the FeatureList.css file for styling.
 *
 * @types FeatureListProps - Type definition for the props passed to the FeatureList component.
 * 
 * @exports FeatureList - The FeatureList component itself.
 */


import './FeatureList.css';


// Type definition for the props passed to the FeatureList component
export type FeatureListProps = {
    title?: string;
    features: string[];
}


/**
 * FeatureList component for displaying a list of features in a structured format.
 * 
 * @param title - The title of the feature list.
 * @param features - An array of strings representing the individual features to be displayed in the list.
 * @returns JSX element representing the feature list
 */
const FeatureList: React.FC<FeatureListProps> = ({ title, features }) => {
    return (
        <section>
            {
                title &&
                <h2 className="featurelist-h2">{title}</h2>
            }
            
            <ul>
                {features.map((feature, index) => (
                    <li className="feature-entry-list" key={index}>{feature}</li>
                ))}
            </ul>
            <br/>
        </section>
    );
}

export default FeatureList;
