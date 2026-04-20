/**
 * @fileoverview A component for displaying toast notifications in the application.
 * 
 * @exports ToastType
 * @exports Toast
 * @exports ToastNotification
 */


// Atoms
import Button from '../atoms/Button';

import './ToastNotification.css';


/**
 * @template ToastType
 * @summary Types of toast notifications.
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';


/**
 * @template Toast
 * @summary Represents a specific toast notification.
 * 
 * @property {number} id - Unique identifier for the toast.
 * @property {string} message - Message content of the toast.
 * @property {ToastType} type - Type of the toast notification.
 */
export type Toast = {
    id: number;
    message: string;
    type: ToastType;
}


/**
 * @template ToastNotificationProps
 * @summary Props for the ToastNotification component.
 * 
 * @property {Toast[]} toasts - Array of toast notifications to display.
 * @property {(id: number) => void} removeToast - Function to remove a toast by its ID.
 */
type ToastNotificationProps = {
    toasts: Toast[];
    removeToast: (id: number) => void;
}


/**
 * @function ToastNotification
 * @summary A React component that renders toast notifications on the screen.
 * 
 * @param toasts - An array of toast notifications to be displayed.
 * @param removeToast - A function to remove a toast notification by its ID.
 * @returns JSX.Element - The rendered toast notifications.
 */
const ToastNotification = ({ toasts, removeToast }: ToastNotificationProps) => {
    
    return (
        <div className="toast-container">
            {/* Iterate over the toasts and display them */}
            {toasts.map((toast) => {
                // Determine the CSS class based on the toast type
                let toastClass = 'toast-panel';
                if (toast.type === 'success') toastClass += ' success';
                else if (toast.type === 'error') toastClass += ' error';
                else if (toast.type === 'warning') toastClass += ' warning';
                else if (toast.type === 'info') toastClass += ' info';

                return (
                    /* Toast notification element */
                    <div
                        key={toast.id}
                        className={toastClass}
                        onClick={() => removeToast(toast.id)}
                    >
                        {/* Main toast content with icon and message */}
                        <div className="toast-content">
                            {/* Icon based on the toast type */}
                            <span className="toast-icon">
                                {toast.type === 'success' && '✓'}
                                {toast.type === 'error' && '✕'}
                                {toast.type === 'warning' && '⚠'}
                                {toast.type === 'info' && 'ℹ'}
                            </span>

                            {/* Toast message content */}
                            <span className="toast-message">{toast.message}</span>
                        </div>
                        
                        {/* Close button to remove the toast notification */}
                        <Button text="×" onClick={() => removeToast(toast.id)} type="icon" />
                    </div>
                );
            })}
        </div>
    );
};

export default ToastNotification;
