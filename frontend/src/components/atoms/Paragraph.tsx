/**
 * @file Paragraph.tsx
 * 
 * @summary Paragraph component.
 *  A reusable paragraph component for displaying text content in a structured format.
 * 
 * @exports Paragraph - The Paragraph component itself.
 */


import './Paragraph.css'


/**
 * Type definition for the props of the Paragraph component.
 * This component takes a single prop, 'text', which is the string content to be displayed within the paragraph.
 */
type ParagraphProps = {
    text: string;
    align?: 'left' | 'center' | 'right';
    large?: boolean;
}


/**
 * Alignment class mapping for the Paragraph component.
 * This object maps the 'align' prop values to corresponding CSS class names for text alignment.
 */
const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
} as const;


/**
 * Paragraph component.
 * A reusable component for displaying text content in a structured format.
 * Text can be aligned left, center, or right based on the 'align' prop, which defaults to 'left' if not provided.
 * 
 * @param param0 - The props for the Paragraph component.
 * @returns React element representing a paragraph.
 */
const Paragraph: React.FC<ParagraphProps> = ({ text, align = 'left', large = false }) => {
    return <p className={`paragraph ${alignClass[align]} ${large ? 'text-3xl' : ''}`}>{text}</p>;
}

export default Paragraph;
