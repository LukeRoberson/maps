/**
 * @file EditBox.tsx
 * 
 * @summary EditBox component.
 *  A reusable component for displaying an editable text box.
 * 
 * @remarks Used for renaming fields, etc.
 * 
 * @exports EditBox - The EditBox component itself.
 */


import './EditBox.css';


/**
 * Type definition for the props of the EditBox component.
 * - `value`: The current value of the text box.
 * - `onChangeFunction`: The function to call when the text box value changes. Eg, when editing starts.
 * - `successFunction`: Optional function to call when editing is successfully completed (e.g., on blur or Enter key).
 * - `cancelFunction`: Optional function to call when editing is cancelled (e.g., on Escape key).
 */
export type EditBoxProps = {
    value: string;
    onChangeFunction: (newValue: string) => void;
    successFunction?: () => void;
    cancelFunction?: () => void;
}


/**
 * EditBox component.
 * A reusable component for displaying an editable text box.
 * 
 * @param value - The current value of the text box.
 * @param onChangeFunction - The function to call when the text box value changes. Eg, when editing starts.
 * @param successFunction - Optional function to call when editing is successfully completed (e.g., on blur or Enter key).
 * @param cancelFunction - Optional function to call when editing is cancelled (e.g., on Escape key).
 * @returns An input element that allows editing of the value, and calls the appropriate functions on change, success, or cancel events.
 */
const EditBox: React.FC<EditBoxProps> = ({ value, onChangeFunction: onChange, successFunction, cancelFunction }) => {
    return (
        <input
            className="edit-box"
            type="text"
            value={value}

            // The function to call when the text box value changes.
            onChange={(e) => onChange(e.target.value)}
            autoFocus

            // Handle key presses for Enter and Escape keys.
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    // Trigger the blur method, which will call the success function if it exists.
                    e.currentTarget.blur();

                } else if (e.key === 'Escape') {
                    // Call the cancel function if it exists.
                    cancelFunction?.();
                }
            }}
            
            // When the input loses focus, call the success function if it exists.
            onBlur={successFunction}
        />
    )
}

export default EditBox;
