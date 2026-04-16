/**
 * @file ToggleSlider.tsx
 * 
 * @summary ToggleSlider component.
 *  Uses a slider to toggle between two options.
 * 
 * @exports ToggleSlider - The ToggleSlider component itself.
 */


import './ToggleSlider.css';


/**
 * Type definition for the ToggleSlider component props.
 * @property {string} label - The label to display next to the slider.
 * @property {boolean} checkedState - The current state of the slider (on/off).
 * @property {function} changeState - A function to call when the slider state changes, receiving the new state as an argument.
 */
export type ToggleSliderProps = {
    label: string;
    checkedState: boolean;
    changeState: (newState: boolean) => void;
};


/**
 * ToggleSlider component that renders a labeled slider to toggle between two states.
 * The slider is styled to visually indicate its state and calls the provided changeState function when toggled.
 * 
 * @param label - The label to display next to the slider.
 * @param checkedState - The current state of the slider (on/off).
 * @param changeState - A function to call when the slider state changes, receiving the new state as an argument.
 * @returns JSX.Element - The rendered ToggleSlider component.
 */
const ToggleSlider: React.FC<ToggleSliderProps> = ({ label, checkedState, changeState }) => {
    return (
        <div className="slide-container">
            <span className="slide-label">{label}</span>
            <label className="toggle-container">
                <input
                    className="toggle-checkbox peer"
                    type="checkbox"
                    checked={checkedState}
                    onChange={(e) => changeState(e.target.checked)}
                />
                <span className="toggle-wrapper toggle-button" />
            </label>
        </div>
    );
}

export default ToggleSlider;
