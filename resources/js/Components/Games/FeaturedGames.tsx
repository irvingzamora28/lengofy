import React from "react";
import { usePage } from "@inertiajs/react";
import GameCard from "./GameCard";
import { useTranslation } from "react-i18next";
import { Game, User } from "@/types";
import { GAME_THUMBNAILS, GAME_DESCRIPTIONS } from "@/constants/games";

interface Props {
    games: Game[];
}

export default function FeaturedGames({ games }: Props) {
    const { auth } = usePage<{ auth: { user: User } }>().props;
    const { t: trans } = useTranslation();

    // Get language pair code if available
    const languagePairCode = auth.user.language_pair
        ? `${auth.user.language_pair.sourceLanguage.code}-${auth.user.language_pair.targetLanguage.code}`
        : null;

    // If language pair is not loaded yet, show all games
    const availableGames = languagePairCode
        ? games.filter(
              (game) =>
                  // If supported_language_pairs is null, game is available for all pairs
                  game.supported_language_pairs === null ||
                  game.supported_language_pairs.includes(languagePairCode)
          )
        : games;

    return (
        <div className="space-y-2 sm:space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white px-1">
                {trans("dashboard.featured_games.title")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                {availableGames.map((game) => (
                    <GameCard
                        key={game.id}
                        id={game.slug}
                        title={game.name}
                        description={
                            GAME_DESCRIPTIONS[game.slug] || game.description
                        }
                        thumbnail={GAME_THUMBNAILS[game.slug]}
                    />
                ))}
            </div>
        </div>
    );
}
