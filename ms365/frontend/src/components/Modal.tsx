import { Component, Show } from 'solid-js';

interface ModalProps {
    show: boolean;
    onClose: () => void;
    title: string;
    children: any;
}

export const Modal: Component<ModalProps> = (props) => (
    <Show when={props.show}>
        <div class="fixed inset-0 z-50 overflow-y-auto">
            <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Backdrop */}
                <div
                    class="fixed inset-0 transition-opacity bg-slate-900/40 backdrop-blur-sm animate-fade-in"
                    onClick={props.onClose}
                ></div>

                {/* Centering trick */}
                <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                {/* Modal Content */}
                <div class="inline-block w-full max-w-2xl p-6 my-8 text-left align-middle transition-all transform bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/20 animate-slide-up sm:align-middle relative z-10">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-bold text-slate-900 leading-6 tracking-tight">{props.title}</h3>
                        <button
                            onClick={props.onClose}
                            class="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {props.children}
                </div>
            </div>
        </div>
    </Show>
);
