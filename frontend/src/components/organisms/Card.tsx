/**
 * @file Card.tsx
 * 
 * @summary Card component.
 *  A reusable card component for displaying content in a structured format.
 * 
 * @exports Card - The Card component itself.
 */


// Atoms
import Heading from '../atoms/Heading';
import Paragraph from '../atoms/Paragraph';
import StrongPair from '../atoms/StrongPair';
import List from '../atoms/List';
import Button from '../atoms/Button';

// Molecules
import EditableHeading from '../Molecules/EditableHeading';

// Types
import type { EditHeadingProps } from '../Molecules/EditableHeading';
import type { ButtonProps } from '../atoms/Button';

import './Card.css'


/** 
 * Type definitions for the content structure of the Card component.
 * Defines the various types of content nodes that can be included in a card, such as headings, paragraphs, labeled text, and lists.
 * Buttons are an array, so they can be used to create a row of buttons within the card.
 */
type CardNode =
    | { kind: 'heading'; level: 1 | 2 | 3; text: string }
    | { kind: 'editable-heading'; settings: EditHeadingProps }
    | { kind: 'paragraph'; align?: 'left' | 'center' | 'right'; large?: boolean; text: string }
    | { kind: 'labeled'; style?: 'default' | 'box' | 'emphasis'; label: string; text: string }
    | { kind: 'list'; ordered?: boolean; items: string[] }
    | { kind: 'button'; settings: ButtonProps[] }
;


/**
 * Type definition for the full card content structure.
 * A card consists of an array of CardNodes, and can optionally have a style property to indicate emphasis.
 */
export type CardBox = {
    card: CardNode[];
    style?: 'default' | 'emphasis';
}


/**
 * Type definition for the props of the Card component.
 * This is the full card containing multiple boxes
 */
export type CardContent = {
    title?: string;
    content: CardBox[];
};


/**
 * A Card component
 * Displays a title and content sections
 * Each full card is made up of multiple boxes, which can contain various types of content (headings, paragraphs, labeled text, lists)
 * 
 * @param config - Configuration object for the card, including title and content
 * @returns JSX element representing the card
 */
const Card: React.FC<CardContent> = ( config ) => {
    // Destructure props
    const { title, content } = config;

    return(
        <>
            {/* The title for the entire card */}
            {title &&
                <Heading level={1} text={title} />
            }

            {/* Iterate over each content box in the card */}
            {content?.map((card, index) => {
                return (
                    <section className={`card-box ${card.style === 'emphasis' ? 'card-emphasis' : ''}`} key={index}>
                        
                        {/* Iterate over each node in the content box */}
                        {card.card.map((node, nodeIndex) => {
                            switch (node.kind) {
                                case 'heading':
                                    return <Heading key={nodeIndex} level={node.level} text={node.text} />
                                
                                case 'editable-heading':
                                    return <EditableHeading key={nodeIndex} {...node.settings} />

                                case 'paragraph':
                                    return <Paragraph key={nodeIndex} align={node.align} large={node.large} text={node.text} />

                                case 'labeled':
                                    return <StrongPair key={nodeIndex} label={node.label} value={node.text} style={node.style} />

                                case 'list':
                                    return <List key={nodeIndex} ordered={node.ordered} items={node.items} />

                                case 'button':
                                    return (
                                        <div className="flex gap-4" key={nodeIndex}>
                                            {node.settings.map((buttonSettings, buttonIndex) => (
                                                <Button key={`${nodeIndex}-${buttonIndex}`} {...buttonSettings} />
                                            ))}
                                        </div>
                                    )

                                default:
                                    return null;
                            }
                        })}
                    </section>
                )
            })}
        </>
    )
}

export default Card;
