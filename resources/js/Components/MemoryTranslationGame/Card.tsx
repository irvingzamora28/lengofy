interface Props {
    index: number;
    word: {
        word: string;
        translation: string;
    };
    isFlipped: boolean;
    isMatched: boolean;
    onClick: () => void;
}

export default function Card({ index, word, isFlipped, isMatched, onClick }: Props) {
    return (
        <div
            onClick={onClick}
            className={`
                relative w-full h-32 cursor-pointer transition-all duration-300 transform
                ${isFlipped ? 'rotate-y-180' : ''}
                ${isMatched ? 'opacity-50' : ''}
            `}
        >
            <div className={`
                absolute w-full h-full backface-hidden
                ${!isFlipped ? 'visible' : 'invisible'}
                bg-blue-500 rounded-lg shadow-lg
                flex items-center justify-center
                text-white text-2xl font-bold
            `}>
                ?
            </div>
            <div className={`
                absolute w-full h-full backface-hidden rotate-y-180
                ${isFlipped ? 'visible' : 'invisible'}
                bg-white border-2 border-blue-500 rounded-lg shadow-lg
                flex items-center justify-center p-2
                text-blue-500 text-lg font-semibold text-center
            `}>
                {index % 2 === 0 ? word.word : word.translation}
            </div>
        </div>
    );
}
