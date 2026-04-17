/**
 * @file Form.tsx
 * 
 * @summary Form component.
 *  A reusable form component.
 * 
 * @exports Form - The Form component itself.
 */


// Atoms
import Heading from "../atoms/Heading";
import Button from "../atoms/Button";

// Molecules
import FormField from "../Molecules/FormField";

// Types
import type { FormFieldProps } from "../Molecules/FormField";
import type { ButtonProps } from "../atoms/Button";

import './Form.css';


type FormProps = {
    heading?: string;
    fields: FormFieldProps[];
    buttons: ButtonProps[];
}


const Form: React.FC<FormProps> = ({ heading, fields, buttons }) => {
    return (
        <>
            {/* Regular heading */}
            {heading && <Heading level={2} text={heading} />}

            {/* Form fields */}
            {fields.map((field, index) => (
                <FormField
                    key={index}
                    {...field}
                />
            ))}

            {/* Form buttons */}
            <div className="form-buttons">
                {buttons.map((button, index) => (
                    <Button
                        key={index}
                        {...button}
                    />
                ))}
            </div>
        </>
    )
}

export default Form;
