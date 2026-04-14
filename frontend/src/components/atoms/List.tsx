/**
 * @file List.tsx
 * 
 * @summary List component.
 *  A reusable component for displaying a list of items, either ordered or unordered.
 * 
 * @exports List - The List component itself.
 */


import './List.css'


/**
 * Type definition for the props of the List component.
 * - `ordered`: A boolean indicating whether the list should be ordered (numbered) or unordered (bulleted). Defaults to false (unordered).
 * - `items`: An array of strings representing the items to be displayed in the list.
 */
type ListProps = {
    ordered?: boolean;
    items: string[];
}


/**
 * List component for displaying a list of items
 * Items may be ordered (numbered) or unordered (bulleted) based on the 'ordered' prop
 * 
 * @param ordered - A boolean indicating whether the list should be ordered (numbered) or unordered (bulleted). Defaults to false (unordered).
 * @param items - An array of strings representing the items to be displayed in the list.
 * @returns JSX element representing the list of items, rendered as either an ordered list (<ol>) or an unordered list (<ul>) based on the 'ordered' prop.
 */
const List: React.FC<ListProps> = ({ ordered = false, items }) => {
    // Create an <ol> or <ul> element based on the 'ordered' prop
    const ListTag = ordered ? 'ol' : 'ul';
    
    return (
        <ListTag className="list-group">
            {items.map((item, index) => (
                /* Class name changes based on whether the list is ordered or unordered */
                <li key={index} className={ordered ? 'ordered-list' : 'unordered-list'}>
                    {item}
                </li>
            ))}
        </ListTag>
    );
}

export default List;
