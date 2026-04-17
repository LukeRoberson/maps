/**
 * @file FormField.tsx
 * 
 * @summary Form field component.
 *  A reusable form field component for input elements.
 * 
 * @exports FormField - The FormField component itself.
 */


import './FormField.css';


/**
 * Props for FormField component.
 * - `label`: The label for the form field.
 * - `fieldtype`: The type of form field, either 'text' or 'textarea'. Defaults to 'text'.
 * - `type`: The HTML input type for text fields (e.g., 'text', 'number', 'email'). Defaults to 'text'.
 * - `value`: The current value of the form field.
 * - `onChange`: A callback function that is called when the value of the form field changes. It receives the new value as an argument.
 */
export type FormFieldProps = {
    label: string;
    fieldtype?: 'text' | 'textarea';
    type?: 'text' | 'number' | 'email' | 'password';
    value: string;
    onChange: (value: string) => void;
}


/**
 * Form field component.
 * Renders either a text input or a textarea based on the `fieldtype` prop, along with a label.
 * @param label - The label for the form field.
 * @param fieldtype - The type of form field to render ('text' or 'textarea').
 * @param type - The HTML input type for text fields (e.g., 'text', 'number', 'email').
 * @param value - The current value of the form field.
 * @param onChange - Callback function called when the value changes, receiving the new value as an argument.
 * @returns JSX element representing the form field.
 */
const FormField: React.FC<FormFieldProps> = ({ label, fieldtype = 'text', type = 'text', value, onChange }) => {
    return (
        <div className="form-group">
            <label className="form-label">
                {label}
            </label>
            
            {fieldtype === 'textarea' ? (
                <textarea
                    className="w-full"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={`Enter ${label.toLowerCase()}`}
                />
            ) : (
                <input
                    className="w-full"
                    type={type}
                    value={value}
                    
                    // Update formData state with new project name
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={`Enter ${label.toLowerCase()}`}
                />
            )}
        </div>
    );
}

export default FormField;
