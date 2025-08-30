import { Link } from "@inertiajs/react";
import { FiBook } from "react-icons/fi";
import { FaPuzzlePiece } from "react-icons/fa";

type Current = "content" | "practice";

interface Props {
  level: string;
  lesson_number: number;
  current: Current;
}

export default function LessonQuickAccessMobile({ level, lesson_number, current }: Props) {
  const baseBtn =
    "p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors";
  const inactive = "text-gray-700 dark:text-gray-300";
  const active = "text-primary-600";

  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-around">
        <Link
          href={route("lessons.show", { level, lesson_number })}
          aria-label="Content"
          aria-current={current === "content" ? "page" : undefined}
          className={`${baseBtn} ${current === "content" ? active : inactive}`}
        >
          <FiBook className="h-5 w-5" />
        </Link>
        <Link
          href={route("lessons.practice", { level, lesson_number })}
          aria-label="Practice"
          aria-current={current === "practice" ? "page" : undefined}
          className={`${baseBtn} ${current === "practice" ? active : inactive}`}
        >
          <FaPuzzlePiece className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
