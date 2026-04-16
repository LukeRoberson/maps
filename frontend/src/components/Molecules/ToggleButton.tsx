/**
 * @file ToggleButton.tsx
 * 
 * @summary ToggleButton component.
 *  Uses buttons to toggle between two options.
 * 
 * @exports ToggleButton - The ToggleButton component itself.
 */


import Button from "../atoms/Button";
import type { ButtonProps } from "../atoms/Button";


/**
 * Type definition for ToggleButton props.
 * - firstButton: Props for the first button.
 * - secondButton: Props for the second button.
 * - selectedOption: Indicates which option is currently selected ('first' or 'second').
 * - onSelect: Callback function to handle option selection changes.
 */
type ToggleButtonProps = {
    firstButton: ButtonProps;
    secondButton: ButtonProps;
    selectedOption: 'first' | 'second';
    onSelect: (option: 'first' | 'second') => void;
};


/**
 * ToggleButton component.
 * Renders two buttons that allow toggling between two options.
 * The selected option is highlighted, and clicking a button triggers the onSelect callback.
 * 
 * @param firstButton - Props for the first button.
 * @param secondButton - Props for the second button.
 * @param selectedOption - Indicates which option is currently selected ('first' or 'second').
 * @param onSelect - Callback function to handle option selection changes.
 * @returns JSX element representing the toggle button component.
 */
const ToggleButton: React.FC<ToggleButtonProps> = ({ firstButton, secondButton, selectedOption, onSelect }) => {
    return (
        <div>
            <Button
                text={firstButton.text}
                onClick={() => onSelect('first')}
                type={selectedOption === 'first' ? 'blue' : 'clear'}
            />
            <Button
                text={secondButton.text}
                onClick={() => onSelect('second')}
                type={selectedOption === 'second' ? 'blue' : 'clear'}
            />
        </div>
    );
}

export default ToggleButton;
