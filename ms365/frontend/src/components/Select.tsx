import { Component, createSignal, For, Show } from 'solid-js';

export interface SelectOption {
    label: string;
    value: string;
    disabled?: boolean;
}

interface SelectProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    class?: string;
}

export const Select: Component<SelectProps> = (props) => {
    const [isOpen, setIsOpen] = createSignal(false);

    const selectedLabel = () => {
        const option = props.options.find(o => o.value === props.value);
        return option ? option.label : props.placeholder || '请选择';
    };

    return (
        <div class={`relative ${props.class || ''}`}>
            <Show when={props.label}>
                <label class="label">
                    {props.label}
                    <Show when={props.required}><span class="text-rose-500 ml-1">*</span></Show>
                </label>
            </Show>

            <div class="relative">
                <button
                    type="button"
                    class={`input text-left flex justify-between items-center cursor-pointer ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${isOpen() ? 'ring-4 ring-primary-500/10 border-primary-500' : ''}`}
                    onClick={() => !props.disabled && setIsOpen(!isOpen())}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                >
                    <span class={!props.value ? 'text-slate-400' : 'text-slate-700'}>
                        {selectedLabel()}
                    </span>
                    <svg
                        class={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen() ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                <Show when={isOpen()}>
                    <div class="absolute z-50 w-full mt-1 bg-white/90 backdrop-blur-xl border border-slate-100 rounded-xl shadow-lg max-h-60 overflow-auto animate-enter-up origin-top">
                        <ul class="py-1">
                            <For each={props.options}>
                                {(option) => (
                                    <li>
                                        <button
                                            type="button"
                                            class={`w-full text-left px-4 py-2.5 text-sm transition-colors
                        ${option.value === props.value ? 'bg-primary-50 text-primary-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}
                        ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                                            onClick={() => {
                                                if (!option.disabled) {
                                                    props.onChange(option.value);
                                                    setIsOpen(false);
                                                }
                                            }}
                                            disabled={option.disabled}
                                        >
                                            {option.label}
                                        </button>
                                    </li>
                                )}
                            </For>
                        </ul>
                    </div>
                </Show>
            </div>
        </div>
    );
};
