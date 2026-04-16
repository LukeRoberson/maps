/**
 * @file Button.tsx
 * 
 * @summary Button component.
 *  A reusable button component for various actions.
 * 
 * @exports Button - The Button component itself.
 */


import './Button.css'


/**
 * Type definition for Button component props.
 * - `text`: The text to display on the button.
 * - `onClick`: The function to call when the button is clicked.
 * - `disabled`: Optional boolean to disable the button.
 * - `type`: Optional string to specify the button style (default is 'clear').
 */
export type ButtonProps = {
    text: string;
    onClick: () => void;
    disabled?: boolean;
    type?: 'blue' | 'green' | 'red' | 'clear' | 'icon';
};


/**
 * The style classes for different button types.
 * - `blue`: Blue background with white text.
 * - `green`: Green background with white text.
 * - `red`: Red background with white text.
 * - `clear`: Transparent background with colored text and border.
 * - `icon`: Icon button with transparent background and border.
 */
const colorClass = {
    blue: 'blue-button',
    green: 'green-button',
    red: 'red-button',
    clear: 'clear-button',
    icon: 'icon-button',
} as const;



/**
 * Button component definition.
 * @param text - The text to display on the button.
 * @param onClick - The function to call when the button is clicked.
 * @param disabled - Optional boolean to disable the button.
 * @param type - Optional string to specify the button style (default is 'clear').
 * @returns JSX element representing the button.
 */
const Button: React.FC<ButtonProps> = ({ text, onClick, disabled, type = 'clear' }) => {
    return (
        <button className={`button ${colorClass[type]}`} onClick={onClick} disabled={disabled}>
            {text}
        </button>
    );
};

export default Button;
