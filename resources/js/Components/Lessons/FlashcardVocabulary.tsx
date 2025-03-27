import React, { useState, useRef, useEffect } from "react";
import { MdTranslate, MdRecordVoiceOver } from "react-icons/md";

type Gender = "fem" | "masc" | "neut";

type VocabularyItem = {
    word: string;
    translation: string;
    exampleSentence: string;
    exampleTranslation: string;
    gender?: Gender;
};

interface FlashcardVocabularyProps {
	item: VocabularyItem;
}

const FlashcardVocabulary: React.FC<FlashcardVocabularyProps> = ({ item }) => {
	const [isFlipped, setIsFlipped] = useState(false);
	const [backCardHeight, setBackCardHeight] = useState("h-24");
	const backCardContentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isFlipped && backCardContentRef.current) {
			const contentHeight = backCardContentRef.current.scrollHeight;
			setBackCardHeight(`h-[${contentHeight}px]`);
		}
	}, [isFlipped]);

	const genderColor = (() => {
		switch (item.gender) {
			case "fem":
				return {
					light: "bg-rose-50 text-rose-700",
					dark: "bg-rose-600/30 text-rose-300"
				};
			case "masc":
				return {
					light: "bg-blue-50 text-blue-700",
					dark: "bg-blue-600/30 text-blue-300"
				};
			case "neut":
			default:
				return {
					light: "bg-green-50 text-green-700",
					dark: "bg-green-600/30 text-green-300"
				};
		}
	})();

	const handleFlip = () => {
		setIsFlipped(!isFlipped);
	};

	return (
		<div
			className={`relative w-full max-w-md mx-auto shadow-lg rounded-xl hover:shadow-xl cursor-pointer
            ${isFlipped ? "animate-flip-to-back" : "animate-flip-to-front"}
            transition-transform duration-500 ease-in-out transform perspective-1000 overflow-hidden`}
			onClick={handleFlip}
		>
            <span className="hidden dark:bg-rose-600/30"></span>
            <span className="hidden dark:bg-blue-600/30"></span>
            <span className="hidden dark:bg-green-600/30"></span>
			{/* Front of the card */}
			<div
				className={`w-full h-full flex flex-col justify-around p-6 items-center text-center
				${isFlipped ? "hidden" : ""}
				${item.gender
					? `${genderColor.light} dark:${genderColor.dark}`
					: "bg-gray-50 text-gray-800 dark:bg-gray-800/30 dark:text-gray-200"}`}
			>
				<div className="grid grid-cols-[auto_1fr] items-center gap-2">
					{/* Empty div for spacing */}
					<div></div>
					<div className="text-lg font-bold text-gray-900 dark:text-gray-100">{item.word}</div>

					{/* Icon and Translation */}
					<MdTranslate className="text-md text-gray-600 dark:text-gray-400" />
					<span className="text-md text-gray-700 dark:text-gray-300">{item.translation}</span>
				</div>
			</div>

			{/* Back of the card */}
			<div
				className={`w-full ${backCardHeight} flex flex-col justify-around p-6 items-center text-center
				${item.gender
					? `${genderColor.light} dark:${genderColor.dark}`
					: "bg-gray-50 text-gray-800 dark:bg-gray-800/30 dark:text-gray-200"}
                ${isFlipped ? "animate-flip-to-back" : "animate-flip-to-front"}
                transition-transform duration-500 ease-in-out transform perspective-1000
                ${isFlipped ? "rotate-y-180" : "rotate-y-0 hidden"} transition-all duration-500 ease-in-out`}
			>
				{/* This div is rotated to make sure the text appears the right way up */}
				<div className={`transform ${isFlipped ? "rotate-y-180" : ""}`} ref={backCardContentRef}>
					<div className="grid grid-cols-[auto_1fr] items-center gap-2">
						{/* Icon and Translation */}
						<MdRecordVoiceOver className="text-md text-gray-600 dark:text-gray-400" />
						<span className="text-md text-gray-900 dark:text-gray-100">{item.exampleSentence}</span>
						<div></div>
						<div className="text-md text-gray-700 dark:text-gray-300 italic ml-2">{item.exampleTranslation}</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default FlashcardVocabulary;
