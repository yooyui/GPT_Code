import { Component, Show } from 'solid-js';

interface FormFieldProps {
    label: string;
    required?: boolean;
    children: any;
}

export const FormField: Component<FormFieldProps> = (props) => (
    <div class="mb-4">
        <label class="label">
            {props.label}
            <Show when={props.required}>
                <span class="text-rose-500 ml-1">*</span>
            </Show>
        </label>
        {props.children}
    </div>
);
