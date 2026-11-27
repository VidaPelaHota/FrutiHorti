import { useState } from 'react';

// Submit state shared by the modal forms: the API error is shown and the form stays filled for a retry.
export function useAsyncSubmit(submit) {
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submitting) return;
        setError(null);
        setSubmitting(true);

        try {
            await submit();
        } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    return { error, submitting, handleSubmit };
}

export function useFormFields(initialForm) {
    const [form, setForm] = useState(initialForm);
    const handleChange = (field) => (event) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
    return { form, handleChange };
}
