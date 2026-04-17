/**
 * @file EditableHeading.tsx
 * 
 * @summary EditableHeading component.
 *  A reusable component for displaying an editable heading.
 *  Will display a heading with an edit button when not editing, and an EditBox when editing.
 * 
 * @exports EditableHeading - The EditableHeading component itself.
 * @exports EditHeadingProps - The props for the EditableHeading component.
 */


import EditBox from '../atoms/EditBox';
import Heading from '../atoms/Heading';
import Button from '../atoms/Button';
import type { EditBoxProps } from '../atoms/EditBox';
import type { HeadingProps } from '../atoms/Heading';
import type { ButtonProps } from '../atoms/Button';


/**
 * Type definition for the props of the EditableHeading component.
 * 
 * @property {boolean} condition - Determines whether to show the EditBox or the Heading.
 * @property {EditBoxProps} editBox - Props to pass to the EditBox component when condition is true.
 * @property {HeadingProps} heading - Props to pass to the Heading component when condition is false.
 * @property {ButtonProps} button - Props to pass to the Button component when condition is false.
 */
export type EditHeadingProps = {
    condition: boolean;
    editBox: EditBoxProps;
    heading: HeadingProps;
    button: ButtonProps;
}


/**
 * EditableHeading component.
 * Displays a heading with an edit button when not editing, and an EditBox when editing.
 * 
 * @param condition - Determines whether to show the EditBox or the Heading.
 * @param editBox - Props to pass to the EditBox component when condition is true.
 * @param heading - Props to pass to the Heading component when condition is false.
 * @param button - Props to pass to the Button component when condition is false.
 * @returns JSX element representing the editable heading.
 */
const EditableHeading: React.FC<EditHeadingProps> = ({ condition, editBox, heading, button }) => {
    return (
        <>
            {/*
                Evaluate the condition prop.
                If true, render the EditBox component with the provided props.
                If false, render the Heading and Button components with the provided props.
            */}
            {condition ? (
                <EditBox
                    value={editBox.value}
                    onChangeFunction={editBox.onChangeFunction}
                    successFunction={editBox.successFunction}
                    cancelFunction={editBox.cancelFunction}
                />
            ) : (
                <div className="flex flex-row items-center gap-2">
                    <Heading
                        level={heading.level}
                        text={heading.text}
                    />
                    <Button
                        text={button.text}
                        onClick={button.onClick}
                        disabled={button.disabled}
                        type={button.type}
                    />
                </div>
            )}
        </>
    );
}

export default EditableHeading;
