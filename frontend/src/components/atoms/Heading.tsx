/**
 * @file Heading.tsx
 * 
 * @summary Heading component.
 *  A reusable heading component for displaying headings in a structured format.
 * 
 * @exports Heading - The Heading component itself.
 */


import './Heading.css'


/**
 * Type definition for the props of the Heading component.
 * The level is the heading level (1, 2, or 3), and text is the content of the heading.
 */
export type HeadingProps = {
    level: 1 | 2 | 3;
    text: string;
}


/**
 * The Heading component
 * Displays a heading based on the specified level (h1, h2, or h3) and text content.
 * 
 * @param param0 The props for the Heading component, including the level and text.
 * @returns A React element representing the heading.
 */
const Heading: React.FC<HeadingProps> = ({ level, text }) => {
    switch (level) {
        case 1:
            return <h1 className="heading-1">{text}</h1>;
        case 2:
            return <h2 className="heading-2">{text}</h2>;
        case 3:
            return <h3 className="heading-3">{text}</h3>;
        default:
            return null;
    }
}

export default Heading;
