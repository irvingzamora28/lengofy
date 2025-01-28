import { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useTranslation } from "react-i18next";

interface Feature {
    id: number;
    name: string;
    description: string;
}

interface FeatureCategory {
    id: number;
    name: string;
    features: Feature[];
}

interface Props {
    categories: FeatureCategory[];
}

export default function UpcomingFeaturesSection({ categories }: Props) {
    const [selectedFeatures, setSelectedFeatures] = useState<number[]>([]);
    const [email, setEmail] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');
    const { t: trans } = useTranslation();

    useEffect(() => {
        console.log("categories", categories);
    }, []);

    const handleFeatureToggle = (featureId: number) => {
        setSelectedFeatures(prev =>
            prev.includes(featureId)
                ? prev.filter(id => id !== featureId)
                : [...prev, featureId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/waitlist/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    features: selectedFeatures,
                }),
            });

            const data = await response.json(); // Parse the JSON response

            if (!response.ok) {
                // Handle validation errors
                if (data.errors && data.errors.email) {
                    setError(data.errors.email[0]); // Set the custom error message
                } else {
                    setError(trans("waitlist.error")); // Fallback error message
                }
                return;
            }

            // Success case
            setSuccessMessage(trans("waitlist.success"));
            setEmail('');
            setSelectedFeatures([]);
            setError('');
        } catch (err) {
            setError(trans("waitlist.error")); // Handle network or other errors
        }
    };

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-24 sm:py-32 bg-gray-50 dark:bg-gray-900"
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-primary-600 dark:text-white sm:text-4xl font-display">
                        {trans("waitlist.title")}
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                        {trans("waitlist.description")}
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Features List */}
                    <div className="space-y-8">
                        {categories.map((category) => (
                            <div key={category.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                                <h3 className="text-xl font-semibold text-primary-600 dark:text-white mb-4">
                                    {category.name}
                                </h3>
                                <ul className="space-y-3">
                                    {category.features.map((feature) => (
                                        <li key={feature.id} className="flex items-start space-x-3">
                                            <input
                                                type="checkbox"
                                                id={`feature-${feature.id}`} // Unique ID for each checkbox
                                                checked={selectedFeatures.includes(feature.id)}
                                                onChange={() => handleFeatureToggle(feature.id)}
                                                className="mt-1 h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                            />
                                            <label
                                                htmlFor={`feature-${feature.id}`} // Associate label with input
                                                className="flex-1 cursor-pointer" // Make the label clickable
                                            >
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {feature.name}
                                                </p>
                                                {feature.description && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {feature.description}
                                                    </p>
                                                )}
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Signup Form */}
                    <div className="lg:sticky lg:top-8">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {trans("waitlist.emailLabel")}
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!email}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                                >
                                    {trans("waitlist.submitButton")}
                                </button>

                                {successMessage && (
                                    <p className="text-sm text-green-600 dark:text-green-400">
                                        {successMessage}
                                    </p>
                                )}

                                {error && (
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {error}
                                    </p>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
