import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";

interface PreviewCardsProps {
    cards: Array<{
        id: string;
        gender: string;
        word: string;
        emoji?: string;
    }>;
    cardPositions: Map<string, DOMRect>;
}

const PreviewCards = ({ cards, cardPositions }: PreviewCardsProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const CARD_HEIGHT = 80;
    const CARD_SPACING = 24;

    return (
        <div ref={containerRef} className="fixed inset-x-0 top-4 z-50 flex justify-center items-start pointer-events-none">
            <div className="relative w-full max-w-[95vw] mx-auto" style={{ minHeight: `${CARD_HEIGHT}px` }}>
                <AnimatePresence>
                    {cards.map((card, index) => {
                        const containerRect = containerRef.current?.getBoundingClientRect();
                        const position = cardPositions.get(card.id);

                        if (!position || !containerRect) return null;

                        // Calculate positions relative to viewport
                        const containerCenterX = containerRect.left + (containerRect.width / 2);
                        const cardCenterX = position.left + (position.width / 2);
                        const initialX = cardCenterX - containerCenterX;
                        const initialY = position.top - containerRect.top;

                        // Calculate final card width based on screen size and word length
                        let finalWidth;
                        if (window.innerWidth < 640) { // sm breakpoint in Tailwind
                            // Mobile: More aggressive width scaling for smaller screens
                            const minWidth = Math.max(position.width * 2, Math.min(card.word.length * 16, containerRect.width * 0.95));
                            finalWidth = Math.max(minWidth, containerRect.width * 0.5);
                        } else {
                            // Desktop: More conservative width scaling
                            const minWidth = Math.max(position.width * 2, Math.min(card.word.length * 12, containerRect.width * 0.6));
                            finalWidth = Math.min(minWidth, containerRect.width * 0.4);
                        }

                        return (
                            <motion.div
                                key={card.id}
                                initial={{
                                    x: initialX,
                                    y: initialY,
                                    width: position.width,
                                    height: position.height,
                                    scale: 1,
                                    opacity: 1
                                }}
                                animate={{
                                    x: -finalWidth / 2, // Center the card by offsetting half its width
                                    y: index * (CARD_HEIGHT + CARD_SPACING),
                                    width: finalWidth,
                                    height: CARD_HEIGHT,
                                    scale: 1.2
                                }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 200,
                                    damping: 20,
                                    restDelta: 0.1
                                }}
                                className="absolute left-1/2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-2 backdrop-blur-sm"
                            >
                                <div className="flex items-center justify-center h-full w-full">
                                    <div className="text-center w-full px-2 whitespace-nowrap">
                                        <p className="text-lg sm:text-xl font-semibold dark:text-gray-100">
                                        {card.id.includes('word') && <>{card.gender} </>}
                                        <>{card.word}</>
                                        </p>
                                        {card.emoji && <p className="text-2xl sm:text-3xl">{card.emoji}</p>}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PreviewCards;
